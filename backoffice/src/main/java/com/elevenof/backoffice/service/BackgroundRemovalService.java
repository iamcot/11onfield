package com.elevenof.backoffice.service;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * Background removal with rembg (deployment/rembg), run on the server only when a photo is uploaded.
 * One process per photo and at most one at a time, so it uses no memory while nobody uploads
 * (the box is shared with anylearn, MySQL and Meilisearch). Photos are shrunk first: the cut-out is
 * shown at most about 1000 px tall, and a smaller input keeps the run short and light.
 */
@Service
@Slf4j
public class BackgroundRemovalService {

    static final int MAX_EDGE = 1280;
    private static final long TIMEOUT_SECONDS = 90;

    private final Semaphore oneAtATime = new Semaphore(1, true);
    private final List<String> command;
    private final String modelDir;

    public BackgroundRemovalService(
            @Value("${app.rembg.command:/opt/rembg/bin/python /opt/rembg/cutout.py}") String command,
            @Value("${app.rembg.model-dir:/opt/rembg/models}") String modelDir) {
        this.command = Arrays.stream(command.trim().split("\\s+")).map(BackgroundRemovalService::expandHome).toList();
        this.modelDir = expandHome(modelDir.trim());
        log.info("Background removal: {} (models in {})", String.join(" ", this.command), this.modelDir);
    }

    /** Lets a local .env say $HOME/... or ~/... (an env file does not expand them by itself). */
    static String expandHome(String path) {
        String home = System.getProperty("user.home");
        if (path.startsWith("~/")) return home + path.substring(1);
        return path.replace("${HOME}", home).replace("$HOME", home);
    }

    /**
     * Remove the background of a photo.
     *
     * @return PNG bytes with a transparent background
     * @throws Exception when rembg is missing, fails or takes too long
     */
    public byte[] removeBackground(byte[] imageBytes) throws Exception {
        byte[] input = shrink(imageBytes);
        if (!oneAtATime.tryAcquire(TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Background removal is busy");
        }
        long started = System.currentTimeMillis();
        log.debug("Background removal started ({} bytes)", input.length);
        try {
            byte[] out = run(input);
            log.info("Background removed: {} -> {} bytes in {} ms", input.length, out.length, System.currentTimeMillis() - started);
            return out;
        } finally {
            oneAtATime.release();
        }
    }

    private byte[] run(byte[] input) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.environment().put("U2NET_HOME", modelDir);
        pb.environment().put("PYTHONDONTWRITEBYTECODE", "1");
        // two threads is the box's whole CPU; more only adds memory
        pb.environment().put("OMP_NUM_THREADS", "2");
        Process process = pb.start();

        CompletableFuture<byte[]> stdout = CompletableFuture.supplyAsync(() -> readAll(process.getInputStream()));
        CompletableFuture<byte[]> stderr = CompletableFuture.supplyAsync(() -> readAll(process.getErrorStream()));
        try (OutputStream stdin = process.getOutputStream()) {
            stdin.write(input);
        } catch (IOException e) {
            // the script died before reading the photo (missing package, bad python): its stderr says why
            process.waitFor(5, TimeUnit.SECONDS);
            throw new IllegalStateException("Background removal exited early: " + tail(stderr.get(5, TimeUnit.SECONDS)));
        }

        if (!process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            throw new IllegalStateException("Background removal timed out");
        }
        byte[] out = stdout.get(5, TimeUnit.SECONDS);
        if (process.exitValue() != 0 || out.length == 0) {
            throw new IllegalStateException("Background removal failed (" + process.exitValue() + "): "
                + tail(stderr.get(5, TimeUnit.SECONDS)));
        }
        return out;
    }

    private static String tail(byte[] stderr) {
        String err = new String(stderr).trim();
        return err.substring(Math.max(0, err.length() - 500));
    }

    private static byte[] readAll(InputStream in) {
        try (in) {
            return in.readAllBytes();
        } catch (IOException e) {
            return new byte[0];
        }
    }

    /** Applies the camera's rotation and keeps the long side at most MAX_EDGE px; PNG keeps transparency. */
    static byte[] shrink(byte[] imageBytes) throws IOException {
        BufferedImage img = Thumbnails.of(new ByteArrayInputStream(imageBytes)).scale(1.0).asBufferedImage();
        if (Math.max(img.getWidth(), img.getHeight()) > MAX_EDGE) {
            img = Thumbnails.of(img).size(MAX_EDGE, MAX_EDGE).asBufferedImage();
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }

    /**
     * Remove background with graceful fallback: when it fails the original photo is kept.
     */
    public byte[] removeBackgroundWithFallback(byte[] imageBytes) {
        try {
            return removeBackground(imageBytes);
        } catch (Exception e) {
            log.warn("Background removal failed, using original image: {}", e.getMessage());
            return imageBytes;
        }
    }
}
