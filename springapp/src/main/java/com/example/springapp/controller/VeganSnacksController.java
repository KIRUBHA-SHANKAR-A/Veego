package com.example.springapp.controller;

import com.example.springapp.dto.AddVeganSnackRequest;
import com.example.springapp.dto.SnackResponseDTO;
import com.example.springapp.dto.SnackUpdateDTO;
import com.example.springapp.model.VeganSnacks;
import com.example.springapp.service.VeganSnacksService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/snacks")
public class VeganSnacksController {

    @Autowired
    private VeganSnacksService snackService;

    @PostMapping
    public ResponseEntity<?> createSnack(@RequestBody AddVeganSnackRequest snack) {
        return snackService.createSnack(snack);
    }

    @GetMapping("/approved")
    public ResponseEntity<List<VeganSnacks>> getApprovedSnacks() {
        try {
            ResponseEntity<List<VeganSnacks>> approvedSnacks = snackService.getApprovedSnacks();
            return approvedSnacks;
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<VeganSnacks>> getAllSnacks() {
        return snackService.getAllSnacks();
    }

    @GetMapping("/{id}")
   public ResponseEntity<VeganSnacks> getSnackById(@PathVariable Long id) {
        return snackService.getSnackById(id);
    }

    @PutMapping("/{snackId}")
    public ResponseEntity<?> updateSnack(
            @PathVariable Long snackId,
            @RequestBody SnackUpdateDTO snackUpdateDTO)
    {
        return snackService.updateSnack(snackId, snackUpdateDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSnack(@PathVariable Long id) {
        return snackService.deleteSnack(id);
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<SnackResponseDTO>> getSnacksByVendor(@PathVariable Long vendorId) {
        return snackService.getSnacksByVendor(vendorId);
    }

}
