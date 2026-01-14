package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.QuizAnalyticsExportController;
import com.diploma.proforientation.service.ExportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class QuizAnalyticsExportControllerTest {

    @Mock
    private ExportService exportService;

    @InjectMocks
    private QuizAnalyticsExportController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.clearContext();
    }

    private void setAdmin() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );
    }

    @Test
    void overviewCsv_shouldReturnFileWithHeaders() {
        setAdmin();
        byte[] csvBytes = "header1,header2\nvalue1,value2".getBytes();
        when(exportService.exportQuizAnalyticsOverviewCsv(10, 2)).thenReturn(csvBytes);

        ResponseEntity<byte[]> response = controller.overviewCsv(10, 2);

        assertThat(response.getBody()).isEqualTo(csvBytes);
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=\"quiz_overview.csv\"");
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_PLAIN);

        verify(exportService).exportQuizAnalyticsOverviewCsv(10, 2);
    }

    @Test
    void detailedCsv_shouldReturnFileWithHeaders() {
        setAdmin();
        byte[] csvBytes = "qId,opt1,opt2\n1,5,3".getBytes();
        when(exportService.exportQuizAnalyticsDetailedCsv(10, 2)).thenReturn(csvBytes);

        ResponseEntity<byte[]> response = controller.detailedCsv(10, 2);

        assertThat(response.getBody()).isEqualTo(csvBytes);
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=\"quiz_detailed.csv\"");
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.TEXT_PLAIN);

        verify(exportService).exportQuizAnalyticsDetailedCsv(10, 2);
    }

    @Test
    void overviewXlsx_shouldReturnFileWithHeaders() {
        setAdmin();
        byte[] xlsxBytes = new byte[]{1, 2, 3};
        when(exportService.exportQuizAnalyticsOverviewExcel(10, 2)).thenReturn(xlsxBytes);

        ResponseEntity<byte[]> response = controller.overviewXlsx(10, 2);

        assertThat(response.getBody()).isEqualTo(xlsxBytes);
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=\"quiz_overview.xlsx\"");
        assertThat(response.getHeaders().getContentType().toString())
                .isEqualTo("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        verify(exportService).exportQuizAnalyticsOverviewExcel(10, 2);
    }

    @Test
    void detailedXlsx_shouldReturnFileWithHeaders() {
        setAdmin();
        byte[] xlsxBytes = new byte[]{4, 5, 6};
        when(exportService.exportQuizAnalyticsDetailedExcel(10, 2)).thenReturn(xlsxBytes);

        ResponseEntity<byte[]> response = controller.detailedXlsx(10, 2);

        assertThat(response.getBody()).isEqualTo(xlsxBytes);
        assertThat(response.getHeaders().getFirst("Content-Disposition"))
                .isEqualTo("attachment; filename=\"quiz_detailed.xlsx\"");
        assertThat(response.getHeaders().getContentType().toString())
                .isEqualTo("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        verify(exportService).exportQuizAnalyticsDetailedExcel(10, 2);
    }
}