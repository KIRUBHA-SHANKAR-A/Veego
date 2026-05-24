package com.example.springapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.springapp.model.ProductReview;
import com.example.springapp.model.VeganSnacks;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    // ===== EXISTING METHODS =====
    List<ProductReview> findByVeganSnackId(Long veganSnackId);
    List<ProductReview> findByCustomerId(Long customerId);

    @Query("SELECT pr FROM ProductReview pr WHERE pr.veganSnack.id = :snackId")
    List<ProductReview> findReviewsBySnackId(@Param("snackId") Long snackId);

    List<ProductReview> findByVeganSnackId(Integer veganSnackId);
    List<ProductReview> findByCustomerId(Integer customerId);

    @Query("SELECT AVG(pr.rating) FROM ProductReview pr WHERE pr.veganSnack.id = :veganSnackId")
    Double findAverageRatingByVeganSnackId(@Param("veganSnackId") Integer veganSnackId);

    @Query("SELECT COUNT(pr) FROM ProductReview pr WHERE pr.veganSnack.id = :veganSnackId")
    Integer countByVeganSnackId(@Param("veganSnackId") Integer veganSnackId);

    boolean existsByCustomerIdAndVeganSnackId(Integer customerId, Integer veganSnackId);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM ProductReview r WHERE r.veganSnack.id = :snackId AND r.customer.id = :customerId")
    boolean existsByVeganSnackIdAndCustomerId(@Param("snackId") Long snackId, @Param("customerId") Long customerId);

    @Query("SELECT r FROM ProductReview r WHERE r.veganSnack.id = :snackId AND r.customer.id = :customerId")
    Optional<ProductReview> findByVeganSnackIdAndCustomerId(@Param("snackId") Long snackId, @Param("customerId") Long customerId);

    // ===== NEW OPTIMIZED METHODS =====
    
    // Fetch reviews with customer details in ONE query (eliminates N+1 for customer)
    @Query("SELECT DISTINCT pr FROM ProductReview pr " +
           "LEFT JOIN FETCH pr.customer c " +
           "WHERE pr.veganSnack.id = :snackId")
    List<ProductReview> findByVeganSnackIdWithCustomer(@Param("snackId") Long snackId);
    
    // Batch fetch reviews for multiple snacks with customer details (ONE query for all snacks)
    @Query("SELECT DISTINCT pr FROM ProductReview pr " +
           "LEFT JOIN FETCH pr.customer c " +
           "WHERE pr.veganSnack.id IN :snackIds")
    List<ProductReview> findByVeganSnackIdsWithCustomer(@Param("snackIds") List<Long> snackIds);
    
    // Get distinct products reviewed by a customer (for the /customer/{customerId}/products endpoint)
    @Query("SELECT DISTINCT pr.veganSnack FROM ProductReview pr " +
           "WHERE pr.customer.id = :customerId")
    List<VeganSnacks> findDistinctProductsReviewedByCustomer(@Param("customerId") Long customerId);
    
    // Get all reviews for a customer with product details in ONE query
    @Query("SELECT DISTINCT pr FROM ProductReview pr " +
           "LEFT JOIN FETCH pr.veganSnack vs " +
           "WHERE pr.customer.id = :customerId")
    List<ProductReview> findByCustomerIdWithProducts(@Param("customerId") Long customerId);
    
    // Batch check which products a user has reviewed (returns list of product IDs)
    @Query("SELECT pr.veganSnack.id FROM ProductReview pr " +
           "WHERE pr.customer.id = :customerId AND pr.veganSnack.id IN :snackIds")
    List<Long> findReviewedProductIdsByCustomerAndSnackIds(
        @Param("customerId") Long customerId, 
        @Param("snackIds") List<Long> snackIds);
    
}