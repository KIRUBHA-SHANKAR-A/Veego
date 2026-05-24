package com.example.springapp.dto;

import lombok.Data;

@Data
public class AddVeganSnackRequest {
    private String snackName;
    private String snackType;
    private String description;
    private String ingredients;
    private String nutritionalInfo;
    private String category;
    private String productImage;
    private Long vendorId;
    private String receipeInstructions;
    private Integer preparationTime;
    private String difficultyLevel;

}