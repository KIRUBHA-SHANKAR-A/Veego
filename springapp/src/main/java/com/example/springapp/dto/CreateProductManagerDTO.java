package com.example.springapp.dto;

import lombok.Data;

@Data
public class CreateProductManagerDTO {
    private String username;
    private String email;
    private String password;
    private String phoneNumber;
}
