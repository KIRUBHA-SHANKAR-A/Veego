package com.example.springapp.controller;

import com.example.springapp.model.Vendor;
import com.example.springapp.service.VendorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vendor")
public class VendorController {

    @Autowired
    private VendorService vendorService;

    @PostMapping
    public ResponseEntity<Vendor> createVendor(@RequestBody Vendor vendor) {
        return vendorService.createVendor(vendor);
    }

    @GetMapping
    public ResponseEntity<List<Vendor>> getAllVendors() {
        return vendorService.getAllVendors();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vendor> getVendorById(@PathVariable Long id) {
        return vendorService.getVendorById(id);
    }

    @GetMapping("/{vendorId}/name")
    public ResponseEntity<String> getVendorNameById(@PathVariable Long vendorId) {
        String vendorName = vendorService.getVendorNameById(vendorId);
        return ResponseEntity.ok(vendorName);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vendor> updateVendor(@PathVariable Long id,
                                               @RequestBody Vendor updated) {
        return vendorService.updateVendor(id, updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        return vendorService.deleteVendor(id);
    }


    // Get vendor by snack ID
    @GetMapping("/snack/{snackId}")
    public ResponseEntity<Vendor> getVendorBySnackId(@PathVariable Long snackId) {
        return vendorService.getVendorBySnackId(snackId);
    }

    // Get vendor name by snack ID
    @GetMapping("/snack/{snackId}/name")
    public ResponseEntity<String> getVendorNameBySnackId(@PathVariable Long snackId) {
        String vendorName = vendorService.getVendorNameBySnackId(snackId);
        return ResponseEntity.ok(vendorName);
    }
}
