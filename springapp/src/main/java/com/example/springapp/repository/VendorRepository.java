package com.example.springapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.springapp.model.User;
import com.example.springapp.model.Vendor;

@Repository
public interface VendorRepository extends JpaRepository<Vendor ,Long> {

    Optional<Vendor> findByUser(User user);

    Optional<Vendor> findByUserId(Long userId);
    
    List<Vendor> findByApprovalStatus(Vendor.ApprovalStatus status);
    
    @Query("SELECT v FROM Vendor v WHERE v.approvalStatus = 'APPROVED'")
    List<Vendor> findApprovedVendors();

    @Query("SELECT v FROM Vendor v WHERE v.approvalStatus = 'PENDING'")
    List<Vendor> findPendingVendors();

    @Query("SELECT u.username FROM Vendor v JOIN v.user u WHERE v.id = :vendorId")
    Optional<String> findVendorNameById(@Param("vendorId") Long vendorId);

    Long countByApprovalStatus(Vendor.ApprovalStatus status);
    
     @Query("SELECT v FROM Vendor v JOIN v.veganSnacks vs WHERE vs.id = :snackId")
    Vendor findVendorBySnackId(@Param("snackId") Long snackId);
}

