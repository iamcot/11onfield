package com.elevenof.backoffice.controller.api;

import com.elevenof.backoffice.dto.response.ProvinceResponse;
import com.elevenof.backoffice.repository.ProvinceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/provinces")
@RequiredArgsConstructor
public class ProvinceController {

    private final ProvinceRepository provinceRepository;

    @GetMapping
    public ResponseEntity<List<ProvinceResponse>> getAllProvinces() {
        List<ProvinceResponse> provinces = provinceRepository.findAll()
            .stream()
            .map(p -> ProvinceResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .build())
            .collect(Collectors.toList());

        return ResponseEntity.ok(provinces);
    }
}
