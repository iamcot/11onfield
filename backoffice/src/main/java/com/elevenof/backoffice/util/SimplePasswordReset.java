package com.elevenof.backoffice.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Simple password reset utility without Spring Boot
 * Usage: java -cp "target/classes:$(mvn dependency:build-classpath | grep -v '\[INFO\]')" \
 *        com.elevenof.backoffice.util.SimplePasswordReset <phone> <new_password>
 */
public class SimplePasswordReset {

    public static void main(String[] args) {
        if (args.length != 2) {
            System.err.println("❌ Missing required parameters");
            System.out.println("Usage: java SimplePasswordReset <phone> <new_password>");
            System.exit(1);
            return;
        }

        String phone = args[0];
        String newPassword = args[1];

        if (newPassword.length() < 6) {
            System.err.println("❌ Password must be at least 6 characters long");
            System.exit(1);
            return;
        }

        try {
            // Read database configuration from YAML
            String jdbcUrl = null;
            String dbUser = null;
            String dbPassword = null;

            try (BufferedReader reader = new BufferedReader(new FileReader("src/main/resources/application.yml"))) {
                String line;
                boolean inDatasource = false;

                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();

                    // Check if we're in datasource section
                    if (trimmed.equals("datasource:")) {
                        inDatasource = true;
                        continue;
                    }

                    // Exit datasource section when we hit another top-level key
                    if (inDatasource && !line.startsWith("    ") && !line.startsWith("\t") && trimmed.length() > 0 && !trimmed.startsWith("#")) {
                        inDatasource = false;
                    }

                    if (inDatasource) {
                        if (trimmed.startsWith("url:")) {
                            jdbcUrl = trimmed.substring(4).trim();
                        } else if (trimmed.startsWith("username:")) {
                            dbUser = trimmed.substring(9).trim();
                        } else if (trimmed.startsWith("password:")) {
                            dbPassword = trimmed.substring(9).trim();
                        }
                    }
                }
            }

            if (jdbcUrl == null || dbUser == null) {
                System.err.println("❌ Failed to read database configuration from application.yml");
                System.exit(1);
                return;
            }

            // Handle environment variable placeholders
            dbUser = resolveValue(dbUser, "root");
            dbPassword = resolveValue(dbPassword, "");

            // Generate BCrypt hash
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            String hashedPassword = encoder.encode(newPassword);

            // Connect to database
            try (Connection conn = DriverManager.getConnection(jdbcUrl, dbUser, dbPassword)) {

                // Check if user exists
                String checkSql = "SELECT id, full_name, role FROM users WHERE phone = ?";
                try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                    checkStmt.setString(1, phone);
                    ResultSet rs = checkStmt.executeQuery();

                    if (!rs.next()) {
                        System.err.println("❌ User not found with phone: " + phone);
                        System.exit(1);
                        return;
                    }

                    String fullName = rs.getString("full_name");
                    String role = rs.getString("role");

                    // Update password
                    String updateSql = "UPDATE users SET password = ? WHERE phone = ?";
                    try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                        updateStmt.setString(1, hashedPassword);
                        updateStmt.setString(2, phone);

                        int rowsAffected = updateStmt.executeUpdate();

                        if (rowsAffected > 0) {
                            System.out.println("✅ Password reset successful!");
                            System.out.println("User: " + fullName + " (" + phone + ")");
                            System.out.println("Role: " + role);
                            System.out.println("New password has been set.");
                        } else {
                            System.err.println("❌ Failed to update password");
                            System.exit(1);
                        }
                    }
                }
            }

        } catch (IOException e) {
            System.err.println("❌ Failed to read application.yml: " + e.getMessage());
            System.exit(1);
        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    /**
     * Resolve environment variable placeholders like ${VAR:default}
     */
    private static String resolveValue(String value, String defaultValue) {
        if (value == null || value.isEmpty()) {
            return defaultValue;
        }

        // Handle ${ENV_VAR:default} format
        if (value.startsWith("${") && value.endsWith("}")) {
            String content = value.substring(2, value.length() - 1);
            String[] parts = content.split(":", 2);
            String envVar = parts[0];
            String defVal = parts.length > 1 ? parts[1] : defaultValue;

            String envValue = System.getenv(envVar);
            return envValue != null ? envValue : defVal;
        }

        return value;
    }
}
