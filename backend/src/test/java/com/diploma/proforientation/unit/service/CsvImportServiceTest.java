package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.importexport.ImportResultDto;
import com.diploma.proforientation.model.Question;
import com.diploma.proforientation.model.QuizVersion;
import com.diploma.proforientation.repository.QuestionRepository;
import com.diploma.proforientation.repository.QuizVersionRepository;
import com.diploma.proforientation.repository.TranslationRepository;
import com.diploma.proforientation.service.impl.CsvImportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CsvImportServiceTest {

    QuizVersionRepository quizVersionRepo = Mockito.mock(QuizVersionRepository.class);
    QuestionRepository questionRepo = Mockito.mock(QuestionRepository.class);
    TranslationRepository translationRepo = Mockito.mock(TranslationRepository.class);

    CsvImportServiceImpl service;

    QuizVersion quizVersion;

    @BeforeEach
    void setup() {
        service = new CsvImportServiceImpl(
                quizVersionRepo,
                questionRepo,
                translationRepo
        );

        quizVersion = new QuizVersion();
        quizVersion.setId(1);
    }

    @Test
    void importQuestions_validCsv_success() {
        String csv = """
                quiz_version_id,ord,qtype,text_default
                1,1,single_choice,Question text
                """;

        MockMultipartFile file = csvFile(csv);

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(quizVersion));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).isEmpty();

        verify(questionRepo).save(any(Question.class));
    }

    @Test
    void importQuestions_invalidEnum_returnsError() {
        String csv = """
                quiz_version_id,ord,qtype,text_default
                1,1,wrong_type,Question text
                """;

        MockMultipartFile file = csvFile(csv);

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(quizVersion));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).hasSize(1);
        assertThat(result.errors().getFirst().field()).isEqualTo("qtype");

        verify(questionRepo, never()).save(any());
    }

    @Test
    void importQuestions_missingRequiredField_returnsError() {
        String csv = """
                quiz_version_id,ord,qtype,text_default
                1,1,single_choice,
                """;

        MockMultipartFile file = csvFile(csv);

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(quizVersion));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).hasSize(1);
        assertThat(result.errors().getFirst().field()).isEqualTo("text_default");

        verify(questionRepo, never()).save(any());
    }

    @Test
    void importQuestions_quizVersionNotFound_returnsError() {
        String csv = """
                quiz_version_id,ord,qtype,text_default
                99,1,single_choice,Question text
                """;

        MockMultipartFile file = csvFile(csv);

        when(quizVersionRepo.findById(99)).thenReturn(Optional.empty());

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.successCount()).isZero();
        assertThat(result.errors()).hasSize(1);
        assertThat(result.errors().getFirst().field()).isEqualTo("quiz_version_id");

        verify(questionRepo, never()).save(any());
    }

    @Test
    void importQuestions_partialSuccess() {
        String csv = """
                quiz_version_id,ord,qtype,text_default
                1,1,single_choice,OK
                1,2,wrong_enum,BAD
                """;

        MockMultipartFile file = csvFile(csv);

        when(quizVersionRepo.findById(1)).thenReturn(Optional.of(quizVersion));

        ImportResultDto result = service.importQuestions(file);

        assertThat(result.totalRows()).isEqualTo(2);
        assertThat(result.successCount()).isEqualTo(1);
        assertThat(result.errors()).hasSize(1);

        verify(questionRepo, times(1)).save(any());
    }

    private MockMultipartFile csvFile(String content) {
        return new MockMultipartFile(
                "file",
                "questions.csv",
                "text/csv",
                content.getBytes(StandardCharsets.UTF_8)
        );
    }
}