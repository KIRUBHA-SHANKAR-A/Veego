package com.example.springapp.dto;

import lombok.Data;

@Data
public class StaffRegisterRequest {
    private String username;
    private String email;
    private String password;
    private String phoneNumber;
    private String role;
}