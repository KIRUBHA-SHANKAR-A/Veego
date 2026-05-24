package com.example.springapp.dto;

import lombok.Data;

@Data
public class VendorRegisterRequest {
    
    private UserRegisterRequest userRegisterRequest;
    private String businessName;
    private String businessDescription;
}