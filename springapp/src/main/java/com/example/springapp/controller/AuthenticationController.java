package com.example.springapp.controller;

import com.example.springapp.dto.LoginRequest;
import com.example.springapp.dto.StaffRegisterRequest;
import com.example.springapp.dto.UserRegisterRequest;
import com.example.springapp.dto.VendorRegisterRequest;
import com.example.springapp.model.User;
import com.example.springapp.model.Vendor;
import com.example.springapp.model.Vendor.ApprovalStatus;
import com.example.springapp.repository.UserRepository;
import com.example.springapp.repository.VendorRepository;
import com.example.springapp.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");


    @Autowired
    private JwtUtil jwtUtil;


    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;



    
    // Combined Product Manager and Admin Login Endpoint
   @PostMapping("/staff/login")
public ResponseEntity<?> staffLogin(@RequestBody LoginRequest loginRequest) {
    
    System.out.println("Staff login attempt for: " + loginRequest.getEmail()); // DEBUG
    
    Optional<User> user = userRepository.findByEmail(loginRequest.getEmail());
    
    if(user.isEmpty()) {
        System.out.println("User not found: " + loginRequest.getEmail()); // DEBUG
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
    }
    
    if(!passwordEncoder.matches(loginRequest.getPassword(), user.get().getPasswordHash())) {
        System.out.println("Password mismatch for: " + loginRequest.getEmail()); // DEBUG
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
    }

    User.Role userRole = user.get().getRole();
    System.out.println("User role found: " + userRole); // DEBUG ← THIS WILL SHOW THE ISSUE
    
    if(userRole != User.Role.PRODUCT_MANAGER && userRole != User.Role.ADMIN) {
        System.out.println("Role rejection - User has: " + userRole); // DEBUG
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Staff role (Product Manager or Admin) required.");
    }

    String token = jwtUtil.generateToken(loginRequest.getEmail(), userRole, user.get().getId());
    return ResponseEntity.ok(Map.of(
        "token", token, 
        "role", userRole,
        "userId", user.get().getId()
    ));    
}
// Staff Registration Endpoint (for ADMIN and PRODUCT_MANAGER)
    @PostMapping("/staff/register")
public ResponseEntity<String> registerStaff(@RequestBody StaffRegisterRequest staffRequest) {
    
    // Validate the request
    if (staffRequest.getUsername() == null || staffRequest.getUsername().trim().isEmpty()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username is required");
    }
    if (staffRequest.getEmail() == null || staffRequest.getEmail().trim().isEmpty()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is required");
    }
    if (staffRequest.getPassword() == null || staffRequest.getPassword().trim().isEmpty()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Password is required");
    }
    
    // Validate staff role
    try {
        User.Role role = User.Role.valueOf(staffRequest.getRole().toUpperCase());
        if (role != User.Role.ADMIN && role != User.Role.PRODUCT_MANAGER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Invalid role. Only ADMIN and PRODUCT_MANAGER roles are allowed for staff registration.");
        }
    } catch (IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body("Invalid role. Valid roles: ADMIN, PRODUCT_MANAGER");
    }
    
    // Check if role already exists for this email
    Optional<User> existingUser = userRepository.findByEmail(staffRequest.getEmail());
    if (existingUser.isPresent() && 
        (existingUser.get().getRole() == User.Role.ADMIN || 
         existingUser.get().getRole() == User.Role.PRODUCT_MANAGER)) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Staff user with this email already exists.");
    }
    
    // Create new staff user
    User newUser = new User();
    newUser.setUsername(staffRequest.getUsername());
    newUser.setEmail(staffRequest.getEmail());
    newUser.setPasswordHash(passwordEncoder.encode(staffRequest.getPassword()));
    newUser.setPhoneNumber(staffRequest.getPhoneNumber());
    newUser.setVendor(null);
    newUser.setProductReviews(null);
    newUser.setRole(User.Role.valueOf(staffRequest.getRole().toUpperCase())); // Convert string to enum
    newUser.setCreatedAt(LocalDateTime.now());
    
    userRepository.save(newUser);
    
    return ResponseEntity.status(HttpStatus.CREATED).body(staffRequest.getRole() + " registration successful!");
}
    // Login Endpoint
   @PostMapping("/user/login")
    public ResponseEntity<?> userLogin(@RequestBody LoginRequest loginRequest) {
        
         Optional<User> user = userRepository.findByEmail(loginRequest.getEmail());
        // Verify password

        if(user.isEmpty() || !passwordEncoder.matches(loginRequest.getPassword(), user.get().getPasswordHash()))
        {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
        }

        String token = jwtUtil.generateToken(loginRequest.getEmail(), User.Role.USER , user.get().getId());
          return ResponseEntity.ok(Map.of(
        "token", token, 
        "role", user.get().getRole(),
        "userId", user.get().getId()
    ));    
}
    
    // Vendor Login Endpoint
    @PostMapping("/vendor/login")
    public ResponseEntity<?> vendorLogin(@RequestBody LoginRequest loginRequest) {
        
        Optional<User> user = userRepository.findByEmail(loginRequest.getEmail());
       // Verify password
    
       if(user.isEmpty() || !passwordEncoder.matches(loginRequest.getPassword(), user.get().getPasswordHash()))
       {
           return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
       }

       Optional<Vendor> vendor = vendorRepository.findByUser(user.get());
       if (vendor == null 
       || vendor.get().getApprovalStatus() != ApprovalStatus.APPROVED) 
        {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Vendor is not yet approved.");
    }
    
       String token = jwtUtil.generateToken(loginRequest.getEmail(), User.Role.VENDOR, vendor.get().getId());
         return ResponseEntity.ok(Map.of(
        "token", token, 
        "role", user.get().getRole(),
        "vendorId", vendor.get().getId()
    ));
    }


     public String validateUser(UserRegisterRequest user) {
       
        if (!StringUtils.hasText(user.getUsername())) {
            return "Username is required.";
        }

        if (userRepository.existsByUsername(user.getUsername())) {
            return "Username already exists.";
        }

        
        if (!StringUtils.hasText(user.getEmail())) {
            return "Email is required.";
        }

        if (!EMAIL_PATTERN.matcher(user.getEmail()).matches()) {
            return "Invalid email format.";
        }
        

        if (userRepository.existsByEmail(user.getEmail())) {
            return "Email already exists.";
        }
        
        if (!StringUtils.hasText(user.getPassword())) {
            return "Password is required.";
        }
        
        if (!PASSWORD_PATTERN.matcher(user.getPassword()).matches()) {
            return "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.";
        }

        
        if (user.getPhoneNumber() == null) {
            return "Phone number is required";
        }
        
        if (userRepository.existsByPhoneNumber(user.getPhoneNumber())) {
            return "Phone Number already exists.";
        }

        if (!user.getPhoneNumber().matches("^[6-9]\\d{9}$")) {
            return "Invalid phone number";
        }
        

        return null;
    }


    // User Registration Endpoint
    @PostMapping("/user/register")
    public ResponseEntity<String> registerUser(@RequestBody UserRegisterRequest user) {
        String validationError = validateUser(user);
        if (validationError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationError);
        }

        // Set properties for a new standard user
        User newUser = new User();
        newUser.setUsername(user.getUsername());
        newUser.setEmail(user.getEmail());
        newUser.setPasswordHash(passwordEncoder.encode(user.getPassword()));
        newUser.setPhoneNumber(user.getPhoneNumber());
        newUser.setVendor(null);
        newUser.setProductReviews(null);
        newUser.setRole(User.Role.USER);
        newUser.setCreatedAt(LocalDateTime.now());
        
        userRepository.save(newUser);
        
        return ResponseEntity.status(HttpStatus.CREATED).body("User registration successful!");
    }

    // Vendor Registration Endpoint
    @PostMapping("/vendor/register")
    public ResponseEntity<String> registerVendor(@RequestBody VendorRegisterRequest vendor) {

        String validationError = validateUser(vendor.getUserRegisterRequest());
        if (validationError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationError);
        }

        // Set common user properties
        User newUser = new User();
        newUser.setUsername(vendor.getUserRegisterRequest().getUsername());
        newUser.setEmail(vendor.getUserRegisterRequest().getEmail());
        newUser.setPasswordHash(passwordEncoder.encode(vendor.getUserRegisterRequest().getPassword()));
        newUser.setPhoneNumber(vendor.getUserRegisterRequest().getPhoneNumber());
        newUser.setProductReviews(null);
        newUser.setRole(User.Role.VENDOR);
        newUser.setCreatedAt(LocalDateTime.now());
        
        
        userRepository.save(newUser);

        // Create and associate the vendor entity
        Vendor newVendor = new Vendor();
        newVendor.setBusinessName(vendor.getBusinessName());
        newVendor.setBusinessDescription(vendor.getBusinessDescription());
        newVendor.setApprovalStatus(Vendor.ApprovalStatus.PENDING);
        newVendor.setUser(newUser);

        newVendor.setUser(newUser); 
        
        newUser.setVendor(newVendor);
        vendorRepository.save(newVendor); 
        
        return ResponseEntity.status(HttpStatus.CREATED).body("Vendor registration successful!");
    }
}