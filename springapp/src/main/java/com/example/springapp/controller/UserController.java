package com.example.springapp.controller;

import com.example.springapp.model.User;
import com.example.springapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCT_MANAGER','USER')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCT_MANAGER','USER')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // Update user
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCT_MANAGER','USER')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        return ResponseEntity.ok(userService.updateUser(id, userDetails));
    }

    // Delete user
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCT_MANAGER')")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        return userService.deleteUserById(id);
    }
}
