package com.example.springapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.springapp.model.VeganSnacks;

@Repository
public interface VeganSnacksRepository extends JpaRepository<VeganSnacks, Long> {
    
    // ===== EXISTING METHODS =====
    @Query("SELECT v FROM VeganSnacks v WHERE v.vendor.id = :vendorId")
    List<VeganSnacks> findSnackByVendorId(@Param("vendorId") Long vendorId);
    
    @Query("SELECT vs FROM VeganSnacks vs WHERE vs.status = 'APPROVED'")
    List<VeganSnacks> findApprovedSnacks();

    @Query("SELECT v FROM VeganSnacks v WHERE v.status = :status")
    List<VeganSnacks> findSnacksByStatus(@Param("status") VeganSnacks.Status status);
    
    @Query("SELECT v FROM VeganSnacks v WHERE v.difficultyLevel = :difficultyLevel")
    List<VeganSnacks> findSnacksByDifficultyLevel(@Param("difficultyLevel") VeganSnacks.DifficultyLevel difficultyLevel);
    
    @Query("SELECT v FROM VeganSnacks v WHERE v.id = :id AND v.vendor.id = :vendorId")
    Optional<VeganSnacks> findSnackByIdAndVendorId(@Param("id") Long id, @Param("vendorId") Long vendorId);

    @Query("SELECT v FROM VeganSnacks v WHERE v.vendor.id = :vendorId AND v.status = :status")
    List<VeganSnacks> findByVendorIdAndStatus(@Param("vendorId") Long vendorId, @Param("status") VeganSnacks.Status status);

    @Query("SELECT v FROM VeganSnacks v WHERE v.id = :id AND v.vendor.id = :vendorId")
    Optional<VeganSnacks> findByIdAndVendorId(@Param("id") Long id, @Param("vendorId") Long vendorId);

    @Query("SELECT v FROM VeganSnacks v WHERE v.status = 'PENDING_APPROVAL'")
    List<VeganSnacks> findPendingApprovalSnacks();
    
    long countByStatus(VeganSnacks.Status status);
    List<VeganSnacks> findByStatus(VeganSnacks.Status status);
    List<VeganSnacks> findByVendorId(Long vendorId);
    
    // ===== NEW OPTIMIZED METHODS =====
    
    // Get approved snacks with vendor details in ONE query (eliminates N+1 for vendor)
    @Query("SELECT DISTINCT vs FROM VeganSnacks vs " +
           "LEFT JOIN FETCH vs.vendor v " +
           "LEFT JOIN FETCH v.user u " +
           "WHERE vs.status = 'APPROVED'")
    List<VeganSnacks> findApprovedSnacksWithVendor();
    
    // Get approved snacks with review statistics (count and average rating)
    @Query("SELECT vs, COUNT(pr) as reviewCount, COALESCE(AVG(pr.rating), 0) as avgRating " +
           "FROM VeganSnacks vs " +
           "LEFT JOIN ProductReview pr ON pr.veganSnack.id = vs.id " +
           "WHERE vs.status = 'APPROVED' " +
           "GROUP BY vs.id")
    List<Object[]> findApprovedSnacksWithReviewStats();
    
    // Get single snack with all details (vendor + user)
    @Query("SELECT DISTINCT vs FROM VeganSnacks vs " +
           "LEFT JOIN FETCH vs.vendor v " +
           "LEFT JOIN FETCH v.user u " +
           "WHERE vs.id = :id")
    Optional<VeganSnacks> findByIdWithDetails(@Param("id") Long id);
}