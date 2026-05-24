package com.example.springapp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "VeganSnacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class VeganSnacks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String snackName;
    private String snackType;
    private String description;
    private String ingredients;
    private String nutritionalInfo;
    @Enumerated(EnumType.STRING)
    private Status status;
    private String category;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String receipeInstructions;  
    
    private Integer preparationTime;   
    
    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficultyLevel;  
    private String rejectionReason;      

    private LocalDateTime createdDate;
    private LocalDateTime lastModified;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    @JsonIgnore
    private User approvedBy;

    private LocalDateTime approvalDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    @JsonBackReference("vendor-snacks")
    private Vendor vendor;

     @Lob
    @Column(columnDefinition = "TEXT")
    private String productImage;

    @OneToMany(mappedBy = "veganSnack", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("snack-reviews")
    private List<ProductReview> productReviews;

    public enum Status {
        PENDING_APPROVAL,
        APPROVED,
        REJECTED
    }
    
    public enum DifficultyLevel {
        EASY,
        MEDIUM,
        HARD
    }
}