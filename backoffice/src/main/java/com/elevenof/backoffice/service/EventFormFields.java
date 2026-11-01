package com.elevenof.backoffice.service;

import com.elevenof.backoffice.model.Address;
import com.elevenof.backoffice.model.Player;
import com.elevenof.backoffice.model.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.regex.Pattern;

/**
 * The registration form of a recruitment event.
 *
 * A form is a JSON list of fields. A field either comes from the player's profile ({@code source} names it,
 * the value is filled in for the player) or is one the admin made up. Profile fields of type "image" and
 * "link" are read only: their value is always taken from the profile when the player sends the form.
 */
@Component
@RequiredArgsConstructor
public class EventFormFields {

    private final ObjectMapper objectMapper;

    @Value("${app.frontend.url:http://localhost:7070}")
    private String frontendUrl;

    /** Types the admin can add as custom fields. */
    public static final Set<String> CUSTOM_TYPES = Set.of(
            "text", "textarea", "number", "date", "email", "phone", "select", "radio", "checkboxes", "agree", "heading");
    private static final Set<String> CHOICE_TYPES = Set.of("select", "radio", "checkboxes");
    private static final Set<String> READ_ONLY_TYPES = Set.of("image", "link");

    public record FormField(String id, String type, String label, Boolean required, String help,
                            List<String> options, String source) {
        public boolean isRequired() { return Boolean.TRUE.equals(required); }
    }

    /** One answer as stored with the application: what the field was called and what the player gave. */
    public record Answer(String id, String type, String label, String value) {}

    /** A field of the player/user profile that a form can take over. */
    public record ProfileField(String key, String group, String label, String type, List<String> options,
                               Function<User, String> read) {}

    private static final DateTimeFormatter DMY = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Map<String, String> GENDER = Map.of("MALE", "Nam", "FEMALE", "Nữ", "OTHER", "Khác");
    private static final Map<String, String> FOOT = Map.of("right", "Chân phải", "left", "Chân trái", "both", "Hai chân");
    private static final Map<String, String> POSITION = Map.of(
            "striker", "Tiền đạo", "midfielder", "Tiền vệ", "defender", "Hậu vệ",
            "centerback", "Trung vệ", "goalkeeper", "Thủ môn");

    private static String str(Object o) { return o == null ? null : String.valueOf(o); }

    private static Optional<Player> player(User u) { return Optional.ofNullable(u.getPlayer()); }

    private static String positions(String csv) {
        if (csv == null || csv.isBlank()) return null;
        return String.join(", ", Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty())
                .map(s -> POSITION.getOrDefault(s, s)).toList());
    }

    private static String fullAddress(Address a) {
        if (a == null) return null;
        List<String> parts = new ArrayList<>();
        if (a.getAddress() != null && !a.getAddress().isBlank()) parts.add(a.getAddress());
        if (a.getWard() != null && !a.getWard().isBlank()) parts.add(a.getWard());
        if (a.getProvince() != null) parts.add(a.getProvince().getName());
        return parts.isEmpty() ? null : String.join(", ", parts);
    }

    private List<ProfileField> catalog() {
        return List.of(
            new ProfileField("user.fullName", "Tài khoản", "Họ và tên", "text", null, User::getFullName),
            new ProfileField("user.dob", "Tài khoản", "Ngày sinh", "date", null,
                    u -> u.getDob() != null ? u.getDob().toString() : null),
            new ProfileField("user.gender", "Tài khoản", "Giới tính", "select", List.of("Nam", "Nữ", "Khác"),
                    u -> u.getGender() != null ? GENDER.get(u.getGender().name()) : null),
            new ProfileField("user.phone", "Tài khoản", "Số điện thoại", "phone", null,
                    u -> u.getPhone() != null && u.getPhone().matches("[0-9+ ]{8,}") ? u.getPhone() : null),
            new ProfileField("user.email", "Tài khoản", "Email", "email", null, User::getEmail),
            new ProfileField("user.province", "Tài khoản", "Tỉnh/thành", "text", null,
                    u -> u.getAddress() != null && u.getAddress().getProvince() != null ? u.getAddress().getProvince().getName() : null),
            new ProfileField("user.address", "Tài khoản", "Địa chỉ liên hệ", "text", null, u -> fullAddress(u.getAddress())),
            new ProfileField("user.avatar", "Tài khoản", "Ảnh đại diện", "image", null, User::getAvatar),
            new ProfileField("user.profileUrl", "Tài khoản", "Link hồ sơ 11of", "link", null,
                    u -> u.getUserid() != null ? frontendUrl + "/profile/" + u.getUserid() : null),

            new ProfileField("player.personalId", "Cầu thủ", "Số CCCD/định danh", "text", null,
                    u -> player(u).map(Player::getPersonalId).orElse(null)),
            new ProfileField("player.address", "Cầu thủ", "Địa chỉ thường trú", "text", null,
                    u -> player(u).map(Player::getAddress).orElse(null)),
            new ProfileField("player.height", "Cầu thủ", "Chiều cao (cm)", "number", null,
                    u -> player(u).map(p -> str(p.getHeight())).orElse(null)),
            new ProfileField("player.weight", "Cầu thủ", "Cân nặng (kg)", "number", null,
                    u -> player(u).map(p -> str(p.getWeight())).orElse(null)),
            new ProfileField("player.positions", "Cầu thủ", "Vị trí thi đấu", "text", null,
                    u -> player(u).map(p -> positions(p.getPositions())).orElse(null)),
            new ProfileField("player.secondaryPosition", "Cầu thủ", "Vị trí phụ", "text", null,
                    u -> player(u).map(p -> positions(p.getSecondaryPosition())).orElse(null)),
            new ProfileField("player.preferredFoot", "Cầu thủ", "Chân thuận", "select", List.of("Chân phải", "Chân trái", "Hai chân"),
                    u -> player(u).map(p -> p.getPreferredFoot() == null ? null : FOOT.getOrDefault(p.getPreferredFoot(), p.getPreferredFoot())).orElse(null)),
            new ProfileField("player.yearsOfExperience", "Cầu thủ", "Số năm chơi bóng", "number", null,
                    u -> player(u).map(p -> str(p.getYearsOfExperience())).orElse(null)),
            new ProfileField("player.level", "Cầu thủ", "Trình độ", "text", null,
                    u -> player(u).map(p -> p.getLevel() != null ? p.getLevel().getDisplayName() : null).orElse(null)),
            new ProfileField("player.school", "Cầu thủ", "Trường đang học", "text", null,
                    u -> player(u).map(Player::getSchool).orElse(null)),
            new ProfileField("player.club", "Cầu thủ", "Câu lạc bộ", "text", null,
                    u -> player(u).map(Player::getClub).orElse(null)),
            new ProfileField("player.academy", "Cầu thủ", "Học viện bóng đá", "text", null,
                    u -> player(u).map(Player::getAcademy).orElse(null)),
            new ProfileField("player.bio", "Cầu thủ", "Giới thiệu bản thân", "textarea", null,
                    u -> player(u).map(Player::getBio).orElse(null)),
            new ProfileField("player.fullBodyPhoto", "Cầu thủ", "Ảnh toàn thân", "image", null,
                    u -> player(u).map(Player::getFullBodyPhoto).orElse(null))
        );
    }

    private Map<String, ProfileField> byKey() {
        Map<String, ProfileField> m = new LinkedHashMap<>();
        for (ProfileField f : catalog()) m.put(f.key(), f);
        return m;
    }

    /** The profile fields the admin can drag into a form. */
    public List<Map<String, Object>> catalogJson() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ProfileField f : catalog()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("key", f.key());
            m.put("group", f.group());
            m.put("label", f.label());
            m.put("type", f.type());
            m.put("options", f.options());
            m.put("readOnly", READ_ONLY_TYPES.contains(f.type()));
            out.add(m);
        }
        return out;
    }

    /** The form a new recruitment event starts with. */
    public List<FormField> defaultForm() {
        List<FormField> out = new ArrayList<>();
        for (String key : List.of("user.fullName", "user.dob", "user.phone", "user.email", "user.address",
                "player.height", "player.weight", "player.positions", "player.preferredFoot", "player.club",
                "user.avatar", "user.profileUrl")) {
            out.add(fromProfile(byKey().get(key), !key.equals("player.club")));
        }
        return out;
    }

    private FormField fromProfile(ProfileField p, boolean required) {
        return new FormField(p.key().replace('.', '_'), p.type(), p.label(), required, null, p.options(), p.key());
    }

    public List<FormField> parse(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<FormField>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    /**
     * Checks a form the admin saved and gives it back in a clean shape: each field has an id, a label and a
     * known type; profile fields keep the type of the profile; choices have options.
     */
    public String normalize(List<FormField> fields) {
        if (fields == null) return null;
        Map<String, ProfileField> profile = byKey();
        Set<String> ids = new HashSet<>();
        List<FormField> out = new ArrayList<>();
        int n = 0;
        for (FormField f : fields) {
            n++;
            String label = f.label() == null ? "" : f.label().trim();
            if (label.isEmpty()) throw new IllegalArgumentException("Trường thứ " + n + " chưa có tên");
            String type;
            List<String> options = f.options() == null ? null
                    : f.options().stream().map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
            String source = f.source() == null || f.source().isBlank() ? null : f.source();
            if (source != null) {
                ProfileField p = profile.get(source);
                if (p == null) throw new IllegalArgumentException("Không có trường hồ sơ " + source);
                type = p.type();
                if (options == null || options.isEmpty()) options = p.options();
            } else {
                type = f.type();
                if (!CUSTOM_TYPES.contains(type)) throw new IllegalArgumentException("Loại trường không hợp lệ: " + type);
            }
            if (CHOICE_TYPES.contains(type) && (options == null || options.isEmpty())) {
                throw new IllegalArgumentException("Trường \"" + label + "\" cần ít nhất một lựa chọn");
            }
            if (!CHOICE_TYPES.contains(type)) options = null;
            String id = f.id() == null || f.id().isBlank() ? "f" + n : f.id().replaceAll("[^A-Za-z0-9_-]", "_");
            while (!ids.add(id)) id = id + "_" + n;
            boolean required = !type.equals("heading") && !READ_ONLY_TYPES.contains(type) && f.isRequired();
            String help = f.help() == null || f.help().isBlank() ? null : f.help().trim();
            out.add(new FormField(id, type, label, required, help, options, source));
        }
        try {
            return objectMapper.writeValueAsString(out);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** What the form shows the player before they type anything: their profile values. */
    public Map<String, String> prefill(List<FormField> fields, User user) {
        Map<String, ProfileField> profile = byKey();
        Map<String, String> out = new LinkedHashMap<>();
        for (FormField f : fields) {
            if (f.source() == null) continue;
            ProfileField p = profile.get(f.source());
            if (p == null) continue;
            String v = p.read().apply(user);
            if (v != null && !v.isBlank()) out.put(f.id(), v);
        }
        return out;
    }

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    /**
     * Turns what the player sent into the stored answers, checking required fields and choices.
     * Read-only profile fields are taken from the profile, whatever the player sent.
     */
    public List<Answer> answers(List<FormField> fields, Map<String, Object> sent, User user) {
        Map<String, ProfileField> profile = byKey();
        Map<String, Object> in = sent == null ? Map.of() : sent;
        List<Answer> out = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (FormField f : fields) {
            if (f.type().equals("heading")) {
                out.add(new Answer(f.id(), f.type(), f.label(), null));
                continue;
            }
            String value;
            if (READ_ONLY_TYPES.contains(f.type()) && f.source() != null && profile.containsKey(f.source())) {
                value = profile.get(f.source()).read().apply(user);
            } else {
                Object raw = in.get(f.id());
                if (raw instanceof Collection<?> c) {
                    value = String.join(", ", c.stream().map(String::valueOf).map(String::trim).filter(s -> !s.isEmpty()).toList());
                } else if (raw instanceof Boolean b) {
                    value = b ? "Đồng ý" : null;
                } else {
                    value = raw == null ? null : String.valueOf(raw).trim();
                }
                if (value != null && value.length() > 5000) value = value.substring(0, 5000);
            }
            if (value != null && value.isEmpty()) value = null;
            if (value != null) {
                switch (f.type()) {
                    case "email" -> {
                        if (!EMAIL.matcher(value).matches()) throw new IllegalArgumentException("\"" + f.label() + "\" không phải email hợp lệ");
                    }
                    case "number" -> {
                        try { Double.parseDouble(value.replace(',', '.')); }
                        catch (NumberFormatException e) { throw new IllegalArgumentException("\"" + f.label() + "\" phải là số"); }
                    }
                    case "date" -> {
                        try { java.time.LocalDate.parse(value); }
                        catch (Exception e) { throw new IllegalArgumentException("\"" + f.label() + "\" không phải ngày hợp lệ"); }
                    }
                    case "select", "radio" -> {
                        if (f.options() != null && !f.options().contains(value)) {
                            throw new IllegalArgumentException("\"" + f.label() + "\" có lựa chọn không hợp lệ");
                        }
                    }
                    case "agree" -> value = "Đồng ý";
                    default -> { }
                }
            }
            if (value == null && f.isRequired()) missing.add(f.label());
            out.add(new Answer(f.id(), f.type(), f.label(), value));
        }
        if (!missing.isEmpty()) throw new IllegalArgumentException("Vui lòng điền: " + String.join(", ", missing));
        return out;
    }

    /** A stored value as people read it: dates as dd/MM/yyyy. */
    public static String display(Answer a) {
        if (a.value() == null) return "";
        if ("date".equals(a.type())) {
            try { return java.time.LocalDate.parse(a.value()).format(DMY); } catch (Exception ignored) { }
        }
        return a.value();
    }

    public String writeAnswers(List<Answer> answers) {
        try {
            return objectMapper.writeValueAsString(answers);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public List<Answer> readAnswers(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Answer>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
