package com.example.springapp.service;

import com.example.springapp.model.User;
import com.example.springapp.model.Vendor;
import com.example.springapp.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    // Create a new vendor
    public ResponseEntity<Vendor> createVendor(Vendor vendor) {
        // Set default values if not set
        if (vendor.getApprovalStatus() == null) {
            vendor.setApprovalStatus(Vendor.ApprovalStatus.PENDING);
        }
        if (vendor.getApprovalDate() == null && vendor.getApprovalStatus() == Vendor.ApprovalStatus.APPROVED) {
            vendor.setApprovalDate(LocalDateTime.now());
        }
        
        Vendor saved = vendorRepository.save(vendor);
        return ResponseEntity.status(201).body(saved);
    }

    // Get all vendors
    public ResponseEntity<List<Vendor>> getAllVendors() {
        return ResponseEntity.ok(vendorRepository.findAll());
    }

    // Get vendor by id
    public ResponseEntity<Vendor> getVendorById(Long id) {
        Optional<Vendor> vendor = vendorRepository.findById(id);
        return vendor.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    // Update vendor - FIXED to match current entity
    public ResponseEntity<Vendor> updateVendor(Long id, Vendor updated) {
        return vendorRepository.findById(id).map(existing -> {
            // Only update fields that exist in current Vendor entity
            if (updated.getBusinessDescription() != null) {
                existing.setBusinessDescription(updated.getBusinessDescription());
            }
            if (updated.getBusinessName() != null) {
                existing.setBusinessName(updated.getBusinessName());
            }
            if (updated.getApprovalStatus() != null) {
                existing.setApprovalStatus(updated.getApprovalStatus());
                if (updated.getApprovalStatus() == Vendor.ApprovalStatus.APPROVED) {
                    existing.setApprovalDate(LocalDateTime.now());
                }
            }
            if (updated.getApprovalDate() != null) {
                existing.setApprovalDate(updated.getApprovalDate());
            }
            if (updated.getApprovedBy() != null) {
                existing.setApprovedBy(updated.getApprovedBy());
            }
            if (updated.getUser() != null) {
                existing.setUser(updated.getUser());
            }
        
            
            Vendor saved = vendorRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete vendor
    public ResponseEntity<Void> deleteVendor(Long id) {
        if (vendorRepository.existsById(id)) {
            vendorRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    public Optional<Vendor> findById(Long vendorId) {
        return vendorRepository.findById(vendorId);
    }
    
    // Additional useful methods
    
    // Get vendor by user ID
    public ResponseEntity<Vendor> getVendorByUserId(Long userId) {
        Optional<Vendor> vendor = vendorRepository.findByUserId(userId);
        return vendor.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    // Get vendors by approval status
    public ResponseEntity<List<Vendor>> getVendorsByStatus(Vendor.ApprovalStatus status) {
        List<Vendor> vendors = vendorRepository.findByApprovalStatus(status);
        return ResponseEntity.ok(vendors);
    }
    
    // Approve vendor
    public ResponseEntity<Vendor> approveVendor(Long id, User approvedByUser) {
        Optional<Vendor> vendorOpt = vendorRepository.findById(id);
        if (vendorOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Vendor vendor = vendorOpt.get();
        vendor.setApprovalStatus(Vendor.ApprovalStatus.APPROVED);
        vendor.setApprovalDate(LocalDateTime.now());
        vendor.setApprovedBy(approvedByUser);
        
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }
    
    // Reject vendor
    public ResponseEntity<Vendor> rejectVendor(Long id) {
        Optional<Vendor> vendorOpt = vendorRepository.findById(id);
        if (vendorOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Vendor vendor = vendorOpt.get();
        vendor.setApprovalStatus(Vendor.ApprovalStatus.REJECTED);
        vendor.setApprovalDate(LocalDateTime.now());
        
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }
    
    // Suspend vendor
    public ResponseEntity<Vendor> suspendVendor(Long id) {
        Optional<Vendor> vendorOpt = vendorRepository.findById(id);
        if (vendorOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Vendor vendor = vendorOpt.get();
        vendor.setApprovalStatus(Vendor.ApprovalStatus.SUSPENDED);
        
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }

    public String getVendorNameById(Long vendorId) {
        return vendorRepository.findVendorNameById(vendorId)
            .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + vendorId));
    }

    // Get vendor by snack ID
public ResponseEntity<Vendor> getVendorBySnackId(Long snackId) {
    try {
        Vendor vendor = vendorRepository.findVendorBySnackId(snackId);
        if (vendor == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(vendor);
    } catch (Exception e) {
        return ResponseEntity.badRequest().build();
    }
}

// Get vendor name by snack ID
public String getVendorNameBySnackId(Long snackId) {
    Vendor vendor = vendorRepository.findVendorBySnackId(snackId);
    return vendor != null ? vendor.getBusinessName() : "Unknown Vendor";
}


}