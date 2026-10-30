package com.elevenof.backoffice.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;

/** Bytes (e.g. a picture with its background removed) wrapped as a MultipartFile for S3Service. */
public class ByteArrayMultipartFile implements MultipartFile {
    private final byte[] content;
    private final String filename;
    private final String contentType;

    public ByteArrayMultipartFile(byte[] content, String filename, String contentType) {
        this.content = content;
        this.filename = filename;
        this.contentType = contentType;
    }

    @Override public String getName() { return "file"; }
    @Override public String getOriginalFilename() { return filename; }
    @Override public String getContentType() { return contentType; }
    @Override public boolean isEmpty() { return content == null || content.length == 0; }
    @Override public long getSize() { return content.length; }
    @Override public byte[] getBytes() { return content; }
    @Override public InputStream getInputStream() { return new ByteArrayInputStream(content); }
    @Override public void transferTo(File dest) { throw new UnsupportedOperationException("transferTo not supported"); }
}
