package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.ImportController;
import com.diploma.proforientation.dto.importexport.ImportResultDto;
import com.diploma.proforientation.service.ImportService;
import com.diploma.proforientation.service.impl.ExcelImportServiceImpl;
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
    private ExcelImportServiceImpl excelImportService;

    @InjectMocks
    private ImportController controller;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void importTranslationsExcel_validFile_returnsResult() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "translations.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "xlsx-content".getBytes()
        );

        ImportResultDto mockResult = new ImportResultDto(2, 2, java.util.List.of());
        when(excelImportService.importTranslations(file)).thenReturn(mockResult);

        ImportResultDto result = controller.importTranslationsExcel(file);

        assertThat(result).isEqualTo(mockResult);
        verify(excelImportService).importTranslations(file);
        verifyNoMoreInteractions(excelImportService);
    }

    @Test
    void importTranslationsExcel_serviceThrows_propagates() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "translations.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "xlsx-content".getBytes()
        );

        when(excelImportService.importTranslations(file))
                .thenThrow(new RuntimeException("Invalid Excel"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> controller.importTranslationsExcel(file));

        assertThat(ex.getMessage()).contains("Invalid Excel");
        verify(excelImportService).importTranslations(file);
        verifyNoMoreInteractions(excelImportService);
    }

    @Test
    void importQuizzesExcel_validFile_returnsResult() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "quizzes.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "xlsx-content".getBytes()
        );

        ImportResultDto mockResult = new ImportResultDto(3, 2, java.util.List.of());
        when(excelImportService.importQuizzes(file)).thenReturn(mockResult);

        ImportResultDto result = controller.importQuizzesExcel(file);

        assertThat(result).isEqualTo(mockResult);
        verify(excelImportService).importQuizzes(file);
        verifyNoMoreInteractions(excelImportService);
    }

    @Test
    void importProfessionsExcel_validFile_returnsResult() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "professions.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "xlsx-content".getBytes()
        );

        ImportResultDto mockResult = new ImportResultDto(5, 5, java.util.List.of());
        when(excelImportService.importProfessions(file)).thenReturn(mockResult);

        ImportResultDto result = controller.importProfessionsExcel(file);

        assertThat(result).isEqualTo(mockResult);
        verify(excelImportService).importProfessions(file);
        verifyNoMoreInteractions(excelImportService);
    }

    @Test
    void importQuestionsExcel_validFile_returnsResult() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "questions.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "xlsx-content".getBytes()
        );

        ImportResultDto mockResult = new ImportResultDto(10, 9, java.util.List.of());
        when(excelImportService.importQuestions(file)).thenReturn(mockResult);

        ImportResultDto result = controller.importQuestions(file);

        assertThat(result).isEqualTo(mockResult);
        verify(excelImportService).importQuestions(file);
        verifyNoMoreInteractions(excelImportService);
    }

    @Test
    void importQuestionsExcel_serviceThrows_propagates() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "questions.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "xlsx-content".getBytes()
        );

        when(excelImportService.importQuestions(file))
                .thenThrow(new RuntimeException("Boom"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> controller.importQuestions(file));

        assertThat(ex.getMessage()).contains("Boom");
        verify(excelImportService).importQuestions(file);
        verifyNoMoreInteractions(excelImportService);
    }
}