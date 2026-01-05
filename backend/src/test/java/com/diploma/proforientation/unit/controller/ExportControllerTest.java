package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.ExportController;
import com.diploma.proforientation.service.ExportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class ExportControllerTest {

    @Mock
    private ExportService exportService;

    @InjectMocks
    private ExportController exportController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void exportExcel_success_returnsByteArray() {
        byte[] data = new byte[]{1, 2, 3};
        when(exportService.exportAllToExcel()).thenReturn(data);

        ResponseEntity<byte[]> response = exportController.exportExcel();

        assertThat(response.getBody()).isEqualTo(data);
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=data.xlsx");

        verify(exportService).exportAllToExcel();
    }

    @Test
    void exportCsv_supportedEntity_returnsByteArray() {
        String entity = "questions";
        byte[] data = "csv-data".getBytes();
        when(exportService.exportEntityToCsv(entity)).thenReturn(data);

        ResponseEntity<byte[]> response = exportController.exportCsv(entity);

        assertThat(response.getBody()).isEqualTo(data);
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=questions.csv");

        verify(exportService).exportEntityToCsv(entity);
    }

    @Test
    void exportCsv_unsupportedEntity_throwsException() {
        String entity = "unknown";
        when(exportService.exportEntityToCsv(entity))
                .thenThrow(new IllegalArgumentException("Unsupported export entity"));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> exportController.exportCsv(entity));

        assertThat(ex.getMessage()).contains("Unsupported export entity");
        verify(exportService).exportEntityToCsv(entity);
    }

    @Test
    void exportCsv_serviceThrowsRuntimeException_propagates() {
        String entity = "questions";
        when(exportService.exportEntityToCsv(entity))
                .thenThrow(new RuntimeException("CSV failed"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> exportController.exportCsv(entity));

        assertThat(ex.getMessage()).contains("CSV failed");
        verify(exportService).exportEntityToCsv(entity);
    }

    @Test
    void exportExcel_serviceThrowsRuntimeException_propagates() {
        when(exportService.exportAllToExcel()).thenThrow(new RuntimeException("Excel failed"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> exportController.exportExcel());

        assertThat(ex.getMessage()).contains("Excel failed");
        verify(exportService).exportAllToExcel();
    }
}