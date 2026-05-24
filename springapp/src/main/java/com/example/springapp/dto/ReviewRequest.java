package com.example.springapp.dto;

 public class ReviewRequest {
        private Integer veganSnackId;
        private Integer customerId;
        private Integer rating;
        private String reviewText;

        // Getters and setters
        public Integer getVeganSnackId() { return veganSnackId; }
        public void setVeganSnackId(Integer veganSnackId) { this.veganSnackId = veganSnackId; }
        
        public Integer getCustomerId() { return customerId; }
        public void setCustomerId(Integer customerId) { this.customerId = customerId; }
        
        public Integer getRating() { return rating; }
        public void setRating(Integer rating) { this.rating = rating; }
        
        public String getReviewText() { return reviewText; }
        public void setReviewText(String reviewText) { this.reviewText = reviewText; }
    }