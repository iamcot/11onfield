package com.elevenof.backoffice.controller.admin;

import com.elevenof.backoffice.dto.zns.ZnsTokenResponse;
import com.elevenof.backoffice.service.ZnsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

@Controller
@RequestMapping("/admin/zns")
@RequiredArgsConstructor
public class ZnsAdminController {
    private final ZnsService znsService;

    // Display ZNS token management page
    @GetMapping
    public String znsTokenPage(Model model) {
        try {
            Map<String, String> tokenInfo = znsService.getTokenInfo();
            model.addAttribute("tokenInfo", tokenInfo);
        } catch (Exception e) {
            model.addAttribute("error", "Failed to load token info");
        }
        model.addAttribute("title", "Quản lý ZNS Token");
        return "admin/zns-token";
    }

    // Redirect to Zalo OAuth
    @GetMapping("/authorize")
    public String authorize() {
        String authUrl = znsService.generateAuthUrl();
        return "redirect:" + authUrl;
    }

    // Handle OAuth callback
    @GetMapping("/callback")
    public String callback(@RequestParam("code") String code, RedirectAttributes redirectAttributes) {
        try {
            ZnsTokenResponse token = znsService.exchangeCodeForToken(code);
            znsService.saveToken(token);
            redirectAttributes.addFlashAttribute("message", "ZNS token configured successfully");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Failed to configure ZNS token: " + e.getMessage());
        }
        return "redirect:/admin/zns";
    }
}
