package com.example.springapp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "Vendor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String businessName;
    private String businessDescription;
    
    @Enumerated(EnumType.STRING)
    private ApprovalStatus approvalStatus;
    
    private LocalDateTime approvalDate;
    
    // Approved by (ADMIN or PRODUCT_MANAGER)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    @JsonIgnoreProperties({"vendor", "passwordHash", "createdAt", "veganSnacks"})
    private User approvedBy;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    @JsonIgnoreProperties({"vendor", "passwordHash", "createdAt", "veganSnacks", "user"})
    private User user;

    @OneToMany(mappedBy = "vendor", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("vendor-snacks")
    private List<VeganSnacks> veganSnacks;

    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED,
        SUSPENDED
    }
}