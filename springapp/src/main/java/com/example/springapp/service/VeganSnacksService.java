package com.example.springapp.service;

import com.example.springapp.dto.AddVeganSnackRequest;
import com.example.springapp.dto.SnackResponseDTO;
import com.example.springapp.dto.SnackUpdateDTO;
import com.example.springapp.model.ProductReview;
import com.example.springapp.model.User;
import com.example.springapp.model.VeganSnacks;
import com.example.springapp.model.Vendor;
import com.example.springapp.repository.ProductReviewRepository;
import com.example.springapp.repository.UserRepository;
import com.example.springapp.repository.VeganSnacksRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VeganSnacksService {

    @Autowired
    private VeganSnacksRepository snackRepository;

    @Autowired 
    private ProductReviewRepository reviewRepository;

    @Autowired
    private VendorService vendorService;
    
    @Autowired
    private UserRepository userRepository;

    // ===== EXISTING METHODS (keep as is) =====
    
    public ResponseEntity<?> createSnack(AddVeganSnackRequest request) {
        // ... your existing code ...
        try {
            Optional<Vendor> vendor = vendorService.findById(request.getVendorId());
            if(vendor.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No Vendors found");
            }
            
            VeganSnacks snack = new VeganSnacks();
            snack.setSnackName(request.getSnackName());
            snack.setSnackType(request.getSnackType());
            snack.setDescription(request.getDescription());
            snack.setIngredients(request.getIngredients());
            snack.setNutritionalInfo(request.getNutritionalInfo());
            snack.setCategory(request.getCategory());
            snack.setProductImage(request.getProductImage());
            snack.setReceipeInstructions(request.getReceipeInstructions());
            snack.setPreparationTime(request.getPreparationTime());
            
            if (request.getDifficultyLevel() != null) {
                try {
                    snack.setDifficultyLevel(VeganSnacks.DifficultyLevel.valueOf(request.getDifficultyLevel().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Invalid difficulty level. Use EASY, MEDIUM, or HARD");
                }
            }
            
            snack.setStatus(VeganSnacks.Status.PENDING_APPROVAL);
            snack.setCreatedDate(LocalDateTime.now());
            snack.setLastModified(LocalDateTime.now());
            snack.setVendor(vendor.get());

            VeganSnacks savedSnack = snackRepository.save(snack);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedSnack);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating snack: " + e.getMessage());
        }
    }

    // ===== OPTIMIZED: Get approved snacks with reviews (2 queries only) =====
    public ResponseEntity<List<VeganSnacks>> getApprovedSnacks() {
        try {
            // Query 1: Get all approved snacks
            List<VeganSnacks> snacks = snackRepository.findApprovedSnacks();
            
            if (!snacks.isEmpty()) {
                // Get all snack IDs
                List<Long> snackIds = snacks.stream()
                    .map(VeganSnacks::getId)
                    .collect(Collectors.toList());
                
                // Query 2: Batch fetch ALL reviews for ALL snacks in ONE query
                List<ProductReview> allReviews = reviewRepository.findByVeganSnackIdsWithCustomer(snackIds);
                
                // Group reviews by snack ID
                Map<Long, List<ProductReview>> reviewsBySnack = allReviews.stream()
                    .collect(Collectors.groupingBy(review -> review.getVeganSnack().getId()));
                
                // Attach reviews to each snack
                for (VeganSnacks snack : snacks) {
                    List<ProductReview> snackReviews = reviewsBySnack.getOrDefault(snack.getId(), new ArrayList<>());
                    snack.setProductReviews(snackReviews);
                }
            }
            
            return ResponseEntity.ok(snacks);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===== OPTIMIZED: Get snack by ID with reviews (2 queries only) =====
    public ResponseEntity<VeganSnacks> getSnackById(Long id) {
        try {
            Optional<VeganSnacks> snackOpt = snackRepository.findById(id);
            if (snackOpt.isPresent()) {
                VeganSnacks snack = snackOpt.get();
                // Fetch reviews with customer details
                List<ProductReview> reviews = reviewRepository.findByVeganSnackIdWithCustomer(id);
                snack.setProductReviews(reviews);
                return ResponseEntity.ok(snack);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===== OPTIMIZED: Get snacks by vendor with reviews =====
    public ResponseEntity<List<SnackResponseDTO>> getSnacksByVendor(Long vendorId) {
        List<VeganSnacks> snacks = snackRepository.findSnackByVendorId(vendorId);
        
        if (!snacks.isEmpty()) {
            // Batch fetch reviews for all snacks
            List<Long> snackIds = snacks.stream()
                .map(VeganSnacks::getId)
                .collect(Collectors.toList());
            
            List<ProductReview> allReviews = reviewRepository.findByVeganSnackIdsWithCustomer(snackIds);
            Map<Long, List<ProductReview>> reviewsBySnack = allReviews.stream()
                .collect(Collectors.groupingBy(review -> review.getVeganSnack().getId()));
            
            List<SnackResponseDTO> snackDTOs = snacks.stream().map(v -> {
                SnackResponseDTO dto = new SnackResponseDTO();
                dto.setId(v.getId());
                dto.setSnackName(v.getSnackName());
                dto.setSnackType(v.getSnackType());
                dto.setDescription(v.getDescription());
                dto.setIngredients(v.getIngredients());
                dto.setNutritionalInfo(v.getNutritionalInfo());
                dto.setCategory(v.getCategory());
                dto.setStatus(v.getStatus().toString());
                dto.setDifficultyLevel(v.getDifficultyLevel() != null ? v.getDifficultyLevel().toString() : null);
                dto.setPreparationTime(v.getPreparationTime());
                dto.setProductImage(v.getProductImage());
                dto.setCreatedDate(v.getCreatedDate());
                dto.setLastModified(v.getLastModified());
                dto.setReceipeInstructions(v.getReceipeInstructions());
                
                // Use pre-fetched reviews
                List<ProductReview> reviews = reviewsBySnack.getOrDefault(v.getId(), new ArrayList<>());
                String combinedReviews = reviews.stream()
                    .map(r -> r.getRating() + ": " + r.getReviewText())
                    .collect(Collectors.joining(", "));
                dto.setReviews(combinedReviews.isEmpty() ? "No review" : combinedReviews);
                
                return dto;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(snackDTOs);
        }
        
        return ResponseEntity.ok(new ArrayList<>());
    }

    // ===== OTHER EXISTING METHODS (keep unchanged) =====
    
    public ResponseEntity<List<VeganSnacks>> getAllSnacks() {
        List<VeganSnacks> snacks = snackRepository.findAll();
        return ResponseEntity.ok(snacks);
    }

    @Transactional
    public ResponseEntity<?> updateSnack(Long id, SnackUpdateDTO dto) {
        Optional<VeganSnacks> snackOpt = snackRepository.findById(id);
        if (snackOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Snack not found with id " + id);
        }

        VeganSnacks snack = snackOpt.get();
        
        if (dto.getSnackName() != null) snack.setSnackName(dto.getSnackName());
        if (dto.getSnackType() != null) snack.setSnackType(dto.getSnackType());
        if (dto.getDescription() != null) snack.setDescription(dto.getDescription());
        if (dto.getIngredients() != null) snack.setIngredients(dto.getIngredients());
        if (dto.getNutritionalInfo() != null) snack.setNutritionalInfo(dto.getNutritionalInfo());
        if (dto.getCategory() != null) snack.setCategory(dto.getCategory());
        if (dto.getReceipeInstructions() != null) snack.setReceipeInstructions(dto.getReceipeInstructions());
        if (dto.getPreparationTime() != null) snack.setPreparationTime(dto.getPreparationTime());
        if (dto.getProductImage() != null) snack.setProductImage(dto.getProductImage());
        
        if (dto.getDifficultyLevel() != null) {
            try {
                snack.setDifficultyLevel(VeganSnacks.DifficultyLevel.valueOf(dto.getDifficultyLevel().toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid difficulty level. Use EASY, MEDIUM, or HARD");
            }
        }
        
        snack.setLastModified(LocalDateTime.now());

        return ResponseEntity.ok(snackRepository.save(snack));
    }

    @Transactional
    public ResponseEntity<Void> deleteSnack(Long id) {
        if (snackRepository.existsById(id)) {
            snackRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @Transactional
    public ResponseEntity<?> approveSnack(Long id, Long approvedByUserId) {
        Optional<VeganSnacks> snackOpt = snackRepository.findById(id);
        if (snackOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Snack not found");
        }
        
        VeganSnacks snack = snackOpt.get();
        
        if (snack.getStatus() == VeganSnacks.Status.APPROVED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Snack is already approved");
        }
        
        Optional<User> userOpt = userRepository.findById(approvedByUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        
        snack.setStatus(VeganSnacks.Status.APPROVED);
        snack.setApprovalDate(LocalDateTime.now());
        snack.setApprovedBy(userOpt.get());
        snack.setLastModified(LocalDateTime.now());
        snack.setRejectionReason(null);
        
        return ResponseEntity.ok(snackRepository.save(snack));
    }
    
    @Transactional
    public ResponseEntity<?> rejectSnack(Long id, String rejectionReason) {
        Optional<VeganSnacks> snackOpt = snackRepository.findById(id);
        if (snackOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Snack not found");
        }
        
        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Rejection reason is required");
        }
        
        VeganSnacks snack = snackOpt.get();
        snack.setStatus(VeganSnacks.Status.REJECTED);
        snack.setRejectionReason(rejectionReason);
        snack.setLastModified(LocalDateTime.now());
        snack.setApprovedBy(null);
        snack.setApprovalDate(null);
        
        return ResponseEntity.ok(snackRepository.save(snack));
    }
    
    public ResponseEntity<List<VeganSnacks>> getPendingSnacks() {
        List<VeganSnacks> pendingSnacks = snackRepository.findSnacksByStatus(VeganSnacks.Status.PENDING_APPROVAL);
        return ResponseEntity.ok(pendingSnacks);
    }
    
    public ResponseEntity<List<VeganSnacks>> getRejectedSnacks() {
        List<VeganSnacks> rejectedSnacks = snackRepository.findSnacksByStatus(VeganSnacks.Status.REJECTED);
        return ResponseEntity.ok(rejectedSnacks);
    }
    
    public boolean isSnackBelongsToVendor(Long snackId, Long vendorId) {
        Optional<VeganSnacks> snack = snackRepository.findByIdAndVendorId(snackId, vendorId);
        return snack.isPresent();
    }
}