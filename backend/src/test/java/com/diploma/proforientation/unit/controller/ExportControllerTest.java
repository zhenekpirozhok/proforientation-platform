package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.ExportController;
import com.diploma.proforientation.dto.QuizMetricsFilter;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import com.diploma.proforientation.service.ExportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;

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

    @Test
    void exportQuizMetricsCsv_success_returnsCsvBytesAndHeaders() {
        QuizMetricsFilter filter = new QuizMetricsFilter(
                1,
                "career",
                QuizStatus.PUBLISHED, // if String -> "PUBLISHED"
                3,
                10, 1000,
                5, 800,
                10, 50,
                BigDecimal.valueOf(120.5), BigDecimal.valueOf(900),
                300, 1800
        );

        byte[] data = "csv-data".getBytes();
        when(exportService.exportQuizMetricsToCsv(filter)).thenReturn(data);

        ResponseEntity<byte[]> response = exportController.exportQuizMetricsCsv(filter);

        assertThat(response.getBody()).isEqualTo(data);
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=quiz_metrics.csv");
        assertThat(response.getHeaders().getContentType())
                .isEqualTo(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8));

        verify(exportService).exportQuizMetricsToCsv(filter);
        verifyNoMoreInteractions(exportService);
    }

    @Test
    void exportQuizMetricsExcel_success_returnsXlsxBytesAndHeaders() {
        QuizMetricsFilter filter = new QuizMetricsFilter(
                null,
                null,
                null,
                null,
                null, null,
                null, null,
                null, null,
                null, null,
                null, null
        );

        byte[] data = new byte[]{1, 2, 3};
        when(exportService.exportQuizMetricsToExcel(filter)).thenReturn(data);

        ResponseEntity<byte[]> response = exportController.exportQuizMetricsExcel(filter);

        assertThat(response.getBody()).isEqualTo(data);
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=quiz_metrics.xlsx");
        assertThat(response.getHeaders().getContentType())
                .isEqualTo(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

        verify(exportService).exportQuizMetricsToExcel(filter);
        verifyNoMoreInteractions(exportService);
    }

    @Test
    void exportQuizMetricsCsv_serviceThrowsRuntimeException_propagates() {
        QuizMetricsFilter filter = new QuizMetricsFilter(
                1, null, QuizStatus.PUBLISHED, null,
                null, null, null, null, null, null,
                null, null, null, null
        );

        when(exportService.exportQuizMetricsToCsv(filter))
                .thenThrow(new RuntimeException("CSV metrics failed"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> exportController.exportQuizMetricsCsv(filter));

        assertThat(ex.getMessage()).contains("CSV metrics failed");
        verify(exportService).exportQuizMetricsToCsv(filter);
        verifyNoMoreInteractions(exportService);
    }

    @Test
    void exportQuizMetricsExcel_serviceThrowsRuntimeException_propagates() {
        QuizMetricsFilter filter = new QuizMetricsFilter(
                null, null, null, null,
                null, null, null, null, null, null,
                null, null, null, null
        );

        when(exportService.exportQuizMetricsToExcel(filter))
                .thenThrow(new RuntimeException("Excel metrics failed"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> exportController.exportQuizMetricsExcel(filter));

        assertThat(ex.getMessage()).contains("Excel metrics failed");
        verify(exportService).exportQuizMetricsToExcel(filter);
        verifyNoMoreInteractions(exportService);
    }
}