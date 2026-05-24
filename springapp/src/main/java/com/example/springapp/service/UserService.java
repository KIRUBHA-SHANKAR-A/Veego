package com.example.springapp.service;

import com.example.springapp.model.User;
import com.example.springapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");

    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");

    public String validateUser(User user, boolean isUpdate, User existingUser) {
       
        if (!StringUtils.hasText(user.getUsername())) {
            return "Username is required.";
        }

        boolean usernameChanged = !isUpdate || !user.getUsername().equals(existingUser.getUsername());

        if (usernameChanged && userRepository.existsByUsername(user.getUsername())) {
            return "Username already exists.";
        }

        
        if (!StringUtils.hasText(user.getEmail())) {
            return "Email is required.";
        }

        if (!EMAIL_PATTERN.matcher(user.getEmail()).matches()) {
            return "Invalid email format.";
        }
        
        boolean emailChanged = !isUpdate || !user.getEmail().equals(existingUser.getEmail());

        if (emailChanged && userRepository.existsByEmail(user.getEmail())) {
            return "Email already exists.";
        }
        
        if (!StringUtils.hasText(user.getPasswordHash())) {
            return "Password is required.";
        }
        
        if (!PASSWORD_PATTERN.matcher(user.getPasswordHash()).matches()) {
            return "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.";
        }
        
        if (user.getRole() == null) {
            return "Role is required";
        }
        
        if (user.getPhoneNumber() == null) {
            return "Phone number is required";
        }
        
        boolean phoneNumberChanged = !isUpdate || !user.getPhoneNumber().equals(existingUser.getPhoneNumber());

        if (phoneNumberChanged && userRepository.existsByPhoneNumber(user.getPhoneNumber())) {
            return "Phone Number already exists.";
        }

        if (!user.getPhoneNumber().matches("^[6-9]\\d{9}$")) {
            return "Invalid phone number";
        }
        

        return null;
    }

    // Create a new user
    public ResponseEntity<String> createUser(User user) {
        String validationError = validateUser(user, false, null);
        if (validationError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationError);
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setPhoneNumber(user.getPhoneNumber());
        user.setCreatedAt(LocalDateTime.now());
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body("User created successfully");
    }

    // Get list of all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get user by ID
    public ResponseEntity<?> getUserById(Long id) {
        Optional<User> userOpt = userRepository.findById(id);

        if(userOpt.isEmpty())
        {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No user found");
        }

        return ResponseEntity.ok(userOpt.get());
    }

    public ResponseEntity<String> updateUser(Long id, User userDetails) {
        Optional<User> existingUserOpt = userRepository.findById(id);
        if (existingUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        String validationError = validateUser(userDetails, true, existingUserOpt.get());
        if (validationError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationError);
        }

        User existingUser = existingUserOpt.get();
        existingUser.setUsername(userDetails.getUsername());
        existingUser.setEmail(userDetails.getEmail());
        existingUser.setPasswordHash(passwordEncoder.encode(userDetails.getPasswordHash()));
        existingUser.setCreatedAt(userDetails.getCreatedAt());
        existingUser.setPhoneNumber(userDetails.getPhoneNumber());
        userRepository.save(existingUser);
        return ResponseEntity.ok("User updated successfully");
    }

    // Delete user by ID
    public ResponseEntity<String> deleteUserById(Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }
}
