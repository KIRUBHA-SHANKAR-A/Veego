package com.example.springapp.controller;

import com.example.springapp.model.ProductReview;
import com.example.springapp.model.VeganSnacks;
import com.example.springapp.service.ProductReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
public class ProductReviewController {

    @Autowired
    private ProductReviewService reviewService;

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ProductReview review) {
        return reviewService.createReview(review);
    }

    @GetMapping
    public ResponseEntity<List<ProductReview>> getAllReviews() {
        return reviewService.getAllReviews();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductReview> getReviewById(@PathVariable Long id) {
        return reviewService.getReviewById(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductReview> updateReview(@PathVariable Long id,
                                                      @RequestBody ProductReview updated) {
        return reviewService.updateReview(id, updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        return reviewService.deleteReview(id);
    }

    @GetMapping("/snack/{veganSnackId}")
    public ResponseEntity<List<ProductReview>> getReviewsByVeganSnack(@PathVariable Long veganSnackId) {
        return reviewService.getReviewsByVeganSnack(veganSnackId);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<ProductReview>> getReviewsByCustomer(@PathVariable Long customerId) {
        return reviewService.getReviewsByCustomer(customerId);
    }


        // NEW: Check if user has already reviewed a specific snack
    @GetMapping("/check/{snackId}/{customerId}")
    public ResponseEntity<Map<String, Boolean>> hasUserReviewed(
            @PathVariable Long snackId, 
            @PathVariable Long customerId) {
        boolean hasReviewed = reviewService.hasUserReviewed(snackId, customerId);
        return ResponseEntity.ok(Map.of("hasReviewed", hasReviewed));
    }
    
    // NEW: Get review by snack ID and customer ID
    @GetMapping("/snack/{snackId}/customer/{customerId}")
    public ResponseEntity<ProductReview> getReviewBySnackAndCustomer(
            @PathVariable Long snackId, 
            @PathVariable Long customerId) {
        return reviewService.getReviewBySnackAndCustomer(snackId, customerId);
    }


    // Add this to ProductReviewController.java
    @GetMapping("/customer/{customerId}/products")
    public ResponseEntity<List<VeganSnacks>> getProductsReviewedByCustomer(@PathVariable Long customerId) {
        return reviewService.getProductsReviewedByCustomer(customerId);
    }



    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<ProductReview>> getReviewsByVendor(@PathVariable Long vendorId) {
        return reviewService.getReviewsByVendor(vendorId);
    }
}
