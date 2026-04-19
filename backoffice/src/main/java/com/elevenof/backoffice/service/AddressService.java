package com.elevenof.backoffice.service;

import com.elevenof.backoffice.exception.ResourceNotFoundException;
import com.elevenof.backoffice.model.Address;
import com.elevenof.backoffice.model.Province;
import com.elevenof.backoffice.model.User;
import com.elevenof.backoffice.repository.AddressRepository;
import com.elevenof.backoffice.repository.ProvinceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AddressService {

    private final AddressRepository addressRepository;
    private final ProvinceRepository provinceRepository;

    @Transactional
    public Address createAddress(User user, Long provinceId) {
        Province province = provinceRepository.findById(provinceId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tỉnh/thành phố"));

        Address address = Address.builder()
            .user(user)
            .province(province)
            .build();

        return addressRepository.save(address);
    }

    @Transactional
    public Address updateOrCreateAddress(User user, Long provinceId) {
        Province province = provinceRepository.findById(provinceId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tỉnh/thành phố"));

        // Check if address already exists
        Address address = addressRepository.findByUserId(user.getId())
            .orElse(Address.builder()
                .user(user)
                .build());

        address.setProvince(province);
        // Keep address and ward as null for now

        Address savedAddress = addressRepository.save(address);
        log.info("Updated address for user ID: {}", user.getId());
        return savedAddress;
    }
}
