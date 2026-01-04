package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.ImportController;
import com.diploma.proforientation.dto.importexport.ImportResultDto;
import com.diploma.proforientation.service.impl.CsvImportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class ImportControllerTest {

    @Mock
    private CsvImportServiceImpl csvImportService;

    @InjectMocks
    private ImportController importController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void importQuestions_validFile_returnsResult() {
        MockMultipartFile file = new MockMultipartFile("file", "questions.csv",
                "text/csv", "csv-content".getBytes());

        ImportResultDto mockResult = new ImportResultDto(1, 5, null);
        when(csvImportService.importQuestions(file)).thenReturn(mockResult);

        ImportResultDto result = importController.importQuestions(file);

        assertThat(result).isEqualTo(mockResult);
        verify(csvImportService).importQuestions(file);
    }

    @Test
    void importQuestions_serviceThrows_runtimeException_propagates() {
        MockMultipartFile file = new MockMultipartFile("file", "questions.csv",
                "text/csv", "csv-content".getBytes());

        when(csvImportService.importQuestions(file))
                .thenThrow(new RuntimeException("Invalid CSV"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> importController.importQuestions(file));

        assertThat(ex.getMessage()).contains("Invalid CSV");
        verify(csvImportService).importQuestions(file);
    }

    @Test
    void importTranslations_validFile_returnsResult() {
        MockMultipartFile file = new MockMultipartFile("file", "translations.csv",
                "text/csv", "csv-content".getBytes());

        ImportResultDto mockResult = new ImportResultDto(2, 10, null);
        when(csvImportService.importTranslations(file)).thenReturn(mockResult);

        ImportResultDto result = importController.importTranslations(file);

        assertThat(result).isEqualTo(mockResult);
        verify(csvImportService).importTranslations(file);
    }

    @Test
    void importTranslations_serviceThrows_runtimeException_propagates() {
        MockMultipartFile file = new MockMultipartFile("file", "translations.csv",
                "text/csv", "csv-content".getBytes());

        when(csvImportService.importTranslations(file))
                .thenThrow(new RuntimeException("Invalid CSV"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> importController.importTranslations(file));

        assertThat(ex.getMessage()).contains("Invalid CSV");
        verify(csvImportService).importTranslations(file);
    }

    @Test
    void importQuestions_nullFile_throwsException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> importController.importQuestions(null));
        assertThat(ex.getMessage()).contains("File must not be null");
        verify(csvImportService, never()).importQuestions(any());
    }

    @Test
    void importTranslations_nullFile_throwsException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> importController.importTranslations(null));
        assertThat(ex.getMessage()).contains("File must not be null");
        verify(csvImportService, never()).importTranslations(any());
    }
}