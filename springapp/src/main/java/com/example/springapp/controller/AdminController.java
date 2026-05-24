package com.example.springapp.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.springapp.dto.CreateProductManagerDTO;
import com.example.springapp.model.User;
import com.example.springapp.model.VeganSnacks;
import com.example.springapp.model.Vendor;
import com.example.springapp.repository.UserRepository;
import com.example.springapp.repository.VeganSnacksRepository;
import com.example.springapp.repository.VendorRepository;
import com.example.springapp.service.VendorService;

@RestController
@RequestMapping("/admin")
public class AdminController {
    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private VeganSnacksRepository veganSnacksRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ==================== PRODUCT MANAGER CREATION ====================
    
    @PostMapping("/create-product-manager")
    public ResponseEntity<?> createProductManager(@RequestBody CreateProductManagerDTO dto) {
        if (userRepository.existsByUsername(dto.getUsername())) {
            return ResponseEntity.status(409).body("Username already exists");
        }
        
        if (userRepository.existsByEmail(dto.getEmail())) {
            return ResponseEntity.status(409).body("Email already exists");
        }
        
        if (userRepository.existsByPhoneNumber(dto.getPhoneNumber())) {
            return ResponseEntity.status(409).body("Phone number already exists");
        }
        
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        user.setRole(User.Role.PRODUCT_MANAGER);
        user.setCreatedAt(LocalDateTime.now());
        user.setPhoneNumber(dto.getPhoneNumber());
        
        userRepository.save(user);
        
        return ResponseEntity.ok("Product Manager created successfully!");
    }
    
    // ==================== VENDOR MANAGEMENT ====================
    
    @GetMapping("/vendors")
    public List<Vendor> getVendors() {
        return vendorRepository.findAll();
    }
    
    @GetMapping("/vendors/count-by-status")
    public ResponseEntity<Map<String, Long>> getVendorCountByStatus() {
        Map<String, Long> countMap = new HashMap<>();
        countMap.put("PENDING", vendorRepository.countByApprovalStatus(Vendor.ApprovalStatus.PENDING));
        countMap.put("APPROVED", vendorRepository.countByApprovalStatus(Vendor.ApprovalStatus.APPROVED));
        countMap.put("REJECTED", vendorRepository.countByApprovalStatus(Vendor.ApprovalStatus.REJECTED));
        countMap.put("TOTAL", vendorRepository.count());
        return ResponseEntity.ok(countMap);
    }

    @PutMapping("/vendor/approve/{id}")
    public ResponseEntity<String> approveVendor(@PathVariable Long id, @RequestParam Long approvedBy) {
        Optional<Vendor> optionalVendor = vendorRepository.findById(id);

        if (optionalVendor.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<User> optionalUser = userRepository.findById(approvedBy);
        
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found with ID: " + approvedBy);
        }
        
        User approvedByUser = optionalUser.get();

        Vendor vendor = optionalVendor.get();
        vendor.setApprovalStatus(Vendor.ApprovalStatus.APPROVED);
        vendor.setApprovalDate(LocalDateTime.now());
        vendor.setApprovedBy(approvedByUser);

        vendorRepository.save(vendor);

        return ResponseEntity.ok("Vendor approved successfully by: " + approvedByUser.getUsername());
    }

    @PutMapping("/vendor/reject/{id}")
    public ResponseEntity<String> rejectVendor(@PathVariable Long id, @RequestParam Long approvedBy) {
        Optional<Vendor> optionalVendor = vendorRepository.findById(id);

        if (optionalVendor.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<User> optionalUser = userRepository.findById(approvedBy);
        
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found with ID: " + approvedBy);
        }
        
        User rejectedByUser = optionalUser.get();

        Vendor vendor = optionalVendor.get();
        vendor.setApprovalStatus(Vendor.ApprovalStatus.REJECTED);
        vendor.setApprovalDate(LocalDateTime.now());
        vendor.setApprovedBy(rejectedByUser);
        
        vendorRepository.save(vendor);
        
        return ResponseEntity.ok("Vendor rejected by: " + rejectedByUser.getUsername());
    }
    
    @GetMapping("/snacks-with-vendor")
public ResponseEntity<List<Map<String, Object>>> getAllSnacksWithVendorInfo() {
    List<VeganSnacks> snacks = veganSnacksRepository.findAll();
    List<Map<String, Object>> response = new ArrayList<>();
    
    for (VeganSnacks snack : snacks) {
        Map<String, Object> snackMap = new HashMap<>();
        snackMap.put("id", snack.getId());
        snackMap.put("snackName", snack.getSnackName());
        snackMap.put("description", snack.getDescription());
        snackMap.put("status", snack.getStatus());
        snackMap.put("vendorId", snack.getVendor() != null ? snack.getVendor().getId() : null);
        snackMap.put("createdDate", snack.getCreatedDate());
        snackMap.put("approvalDate", snack.getApprovalDate());
        snackMap.put("productImage", snack.getProductImage());
        snackMap.put("category", snack.getCategory());
        snackMap.put("snackType", snack.getSnackType());
        snackMap.put("preparationTime", snack.getPreparationTime());
        snackMap.put("difficultyLevel", snack.getDifficultyLevel());
        snackMap.put("ingredients", snack.getIngredients());
        snackMap.put("nutritionalInfo", snack.getNutritionalInfo());
        snackMap.put("receipeInstructions", snack.getReceipeInstructions());
        
        if (snack.getApprovedBy() != null) {
            Map<String, Object> approvedByMap = new HashMap<>();
            approvedByMap.put("id", snack.getApprovedBy().getId());
            approvedByMap.put("username", snack.getApprovedBy().getUsername());
            snackMap.put("approvedBy", approvedByMap);
        }
        
        response.add(snackMap);
    }
    
    return ResponseEntity.ok(response);
}
    
    @GetMapping("/snacks/pending")
    public List<VeganSnacks> findPendingApprovalSnacks() {
        List<VeganSnacks> snacks = veganSnacksRepository.findPendingApprovalSnacks();
        snacks.forEach(snack -> {
            if (snack.getApprovedBy() != null) {
                snack.getApprovedBy().getId();
                snack.getApprovedBy().getUsername();
            }
        });
        return snacks;
    }
    
    @GetMapping("/snacks/count-by-status")
    public ResponseEntity<Map<String, Long>> getSnackCountByStatus() {
        Map<String, Long> countMap = new HashMap<>();
        countMap.put("PENDING_APPROVAL", veganSnacksRepository.countByStatus(VeganSnacks.Status.PENDING_APPROVAL));
        countMap.put("APPROVED", veganSnacksRepository.countByStatus(VeganSnacks.Status.APPROVED));
        countMap.put("REJECTED", veganSnacksRepository.countByStatus(VeganSnacks.Status.REJECTED));
        countMap.put("TOTAL", veganSnacksRepository.count());
        return ResponseEntity.ok(countMap);
    }
    
    @GetMapping("/snacks/by-status")
    public ResponseEntity<List<VeganSnacks>> getSnacksByStatus(@RequestParam String status) {
        VeganSnacks.Status snackStatus;
        try {
            snackStatus = VeganSnacks.Status.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        List<VeganSnacks> snacks = veganSnacksRepository.findByStatus(snackStatus);
        snacks.forEach(snack -> {
            if (snack.getApprovedBy() != null) {
                snack.getApprovedBy().getId();
                snack.getApprovedBy().getUsername();
            }
        });
        return ResponseEntity.ok(snacks);
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getAdminStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        Map<String, Long> snackStats = new HashMap<>();
        snackStats.put("PENDING_APPROVAL", veganSnacksRepository.countByStatus(VeganSnacks.Status.PENDING_APPROVAL));
        snackStats.put("APPROVED", veganSnacksRepository.countByStatus(VeganSnacks.Status.APPROVED));
        snackStats.put("REJECTED", veganSnacksRepository.countByStatus(VeganSnacks.Status.REJECTED));
        snackStats.put("TOTAL", veganSnacksRepository.count());
        stats.put("snacks", snackStats);
        
        Map<String, Long> vendorStats = new HashMap<>();
        vendorStats.put("PENDING", vendorRepository.countByApprovalStatus(Vendor.ApprovalStatus.PENDING));
        vendorStats.put("APPROVED", vendorRepository.countByApprovalStatus(Vendor.ApprovalStatus.APPROVED));
        vendorStats.put("REJECTED", vendorRepository.countByApprovalStatus(Vendor.ApprovalStatus.REJECTED));
        vendorStats.put("TOTAL", vendorRepository.count());
        stats.put("vendors", vendorStats);
        
        return ResponseEntity.ok(stats);
    }

    @PutMapping("/snack/approve/{id}")
    public ResponseEntity<String> approveSnack(@PathVariable Long id, @RequestParam Long approvedBy) {
        Optional<VeganSnacks> optionalSnack = veganSnacksRepository.findById(id);

        if (optionalSnack.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<User> optionalUser = userRepository.findById(approvedBy);
        
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found with ID: " + approvedBy);
        }
        
        User approvedByUser = optionalUser.get();

        VeganSnacks snack = optionalSnack.get();
        snack.setStatus(VeganSnacks.Status.APPROVED);
        snack.setApprovalDate(LocalDateTime.now());
        snack.setApprovedBy(approvedByUser);

        veganSnacksRepository.save(snack);

        return ResponseEntity.ok("Snack approved successfully by: " + approvedByUser.getUsername());
    }

    @PutMapping("/snack/reject/{id}")
    public ResponseEntity<String> rejectSnack(@PathVariable Long id, 
                                             @RequestParam Long approvedBy,
                                             @RequestParam(required = false) String reason) {
        Optional<VeganSnacks> optionalSnack = veganSnacksRepository.findById(id);

        if (optionalSnack.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Optional<User> optionalUser = userRepository.findById(approvedBy);
        
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found with ID: " + approvedBy);
        }
        
        User rejectedByUser = optionalUser.get();

        VeganSnacks snack = optionalSnack.get();
        snack.setStatus(VeganSnacks.Status.REJECTED);
        snack.setApprovalDate(LocalDateTime.now());
        snack.setApprovedBy(rejectedByUser);
        
        if (reason != null && !reason.isEmpty()) {
            snack.setRejectionReason(reason);
        }

        veganSnacksRepository.save(snack);

        String message = reason != null ? 
            "Snack rejected by: " + rejectedByUser.getUsername() + ". Reason: " + reason :
            "Snack rejected by: " + rejectedByUser.getUsername();
        
        return ResponseEntity.ok(message);
    }

    @GetMapping("/snack/{snackId}/name")
    public ResponseEntity<String> getVendorNameBySnackId(@PathVariable Long snackId) {
        String vendorName = vendorService.getVendorNameBySnackId(snackId);
        return ResponseEntity.ok(vendorName);
    }

    @GetMapping("/vendor/{id}")
    public ResponseEntity<Vendor> getVendorById(@PathVariable Long id) {
        return vendorService.getVendorById(id);
    }

}