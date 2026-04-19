package com.elevenof.backoffice.controller.admin;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Admin Login Controller
 * Handles login page display
 */
@Controller
@RequestMapping("/admin")
public class LoginController {

    @GetMapping("/login")
    public String loginPage(
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String logout,
            Model model) {

        if (error != null) {
            model.addAttribute("error", "Số điện thoại hoặc mật khẩu không đúng");
        }

        if (logout != null) {
            model.addAttribute("success", "Bạn đã đăng xuất thành công");
        }

        return "admin/login";
    }
}
