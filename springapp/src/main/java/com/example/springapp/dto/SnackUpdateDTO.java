package com.example.springapp.dto;

import lombok.Data;

@Data
public class SnackUpdateDTO {
    private String snackName;
    private String snackType;
    private String description;
    private String ingredients;
    private String nutritionalInfo;
    private String category;
    private String receipeInstructions;
    private Integer preparationTime;
    private String difficultyLevel;
    private String productImage;
}