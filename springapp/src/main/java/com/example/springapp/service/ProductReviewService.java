package com.example.springapp.service;

import com.example.springapp.model.ProductReview;
import com.example.springapp.model.VeganSnacks;
import com.example.springapp.repository.ProductReviewRepository;
import com.example.springapp.repository.VeganSnacksRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductReviewService {

    @Autowired
    private ProductReviewRepository reviewRepository;

    @Autowired
    private VeganSnacksRepository snackRepository;

    public ResponseEntity<?> createReview(ProductReview review) {
        // Check if user has already reviewed this snack
        boolean alreadyReviewed = reviewRepository.existsByVeganSnackIdAndCustomerId(
            review.getVeganSnack().getId(),
            review.getCustomer().getId()
        );
        
        if (alreadyReviewed) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "You have already reviewed this snack. You can only review a snack once."));
        }
        review.setReviewDate(LocalDateTime.now());
        ProductReview saved = reviewRepository.save(review);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    public ResponseEntity<List<ProductReview>> getAllReviews() {
        return ResponseEntity.ok(reviewRepository.findAll());
    }

    public ResponseEntity<ProductReview> getReviewById(Long id) {
        Optional<ProductReview> review = reviewRepository.findById(id);
        return review.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<ProductReview> updateReview(Long id, ProductReview updated) {
        return reviewRepository.findById(id).map(existing -> {
            existing.setRating(updated.getRating());
            existing.setReviewText(updated.getReviewText());
            ProductReview saved = reviewRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    public ResponseEntity<Void> deleteReview(Long id) {
        if (reviewRepository.existsById(id)) {
            reviewRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ===== OPTIMIZED: Get reviews by snack with customer details (1 query instead of N+1) =====
    public ResponseEntity<List<ProductReview>> getReviewsByVeganSnack(Long veganSnackId) {
        List<ProductReview> reviews = reviewRepository.findByVeganSnackIdWithCustomer(veganSnackId);
        return ResponseEntity.ok(reviews);
    }

    // ===== OPTIMIZED: Get reviews by customer with product details (1 query) =====
    public ResponseEntity<List<ProductReview>> getReviewsByCustomer(Long customerId) {
        List<ProductReview> reviews = reviewRepository.findByCustomerIdWithProducts(customerId);
        return ResponseEntity.ok(reviews);
    }
    
    // Check if user has reviewed a snack
    public boolean hasUserReviewed(Long snackId, Long customerId) {
        return reviewRepository.existsByVeganSnackIdAndCustomerId(snackId, customerId);
    }
    
    // Get review by snack and customer
    public ResponseEntity<ProductReview> getReviewBySnackAndCustomer(Long snackId, Long customerId) {
        Optional<ProductReview> review = reviewRepository.findByVeganSnackIdAndCustomerId(snackId, customerId);
        return review.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    // ===== OPTIMIZED: Get products reviewed by customer (1 query with distinct) =====
    public ResponseEntity<List<VeganSnacks>> getProductsReviewedByCustomer(Long customerId) {
        try {
            // Use the optimized repository method that returns distinct products
            List<VeganSnacks> reviewedProducts = reviewRepository.findDistinctProductsReviewedByCustomer(customerId);
            return ResponseEntity.ok(reviewedProducts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // ===== NEW: Batch check multiple products for user reviews (for frontend optimization) =====
    public ResponseEntity<Map<Long, Boolean>> batchCheckUserReviews(Long customerId, List<Long> snackIds) {
        try {
            if (snackIds == null || snackIds.isEmpty()) {
                return ResponseEntity.ok(new HashMap<>());
            }
            
            // Single query to get all reviewed product IDs
            List<Long> reviewedIds = reviewRepository.findReviewedProductIdsByCustomerAndSnackIds(customerId, snackIds);
            Set<Long> reviewedSet = new HashSet<>(reviewedIds);
            
            // Build response map
            Map<Long, Boolean> result = new HashMap<>();
            for (Long snackId : snackIds) {
                result.put(snackId, reviewedSet.contains(snackId));
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

        public ResponseEntity<List<ProductReview>> getReviewsByVendor(Long vendorId) {
        try {
            // First get all snacks for this vendor
            List<VeganSnacks> vendorSnacks = snackRepository.findSnackByVendorId(vendorId);
            
            if (vendorSnacks.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            // Get all snack IDs
            List<Long> snackIds = vendorSnacks.stream()
                .map(VeganSnacks::getId)
                .collect(Collectors.toList());
            
            // Get all reviews for these snacks
            List<ProductReview> reviews = reviewRepository.findByVeganSnackIdsWithCustomer(snackIds);
            
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}