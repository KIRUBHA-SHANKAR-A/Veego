package com.example.springapp.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonAlias;

import lombok.Data;

@Data
public class SnackResponseDTO {
    private Long id;
    private String snackName;
    private String snackType;
    private String description;
    private String ingredients;
    private String nutritionalInfo;
    private String category;
    private String status;
    private String difficultyLevel;
    private Integer preparationTime;
    private String receipeInstructions;
    private String productImage;
    private String reviews;
    private LocalDateTime createdDate;
    private LocalDateTime lastModified;
}