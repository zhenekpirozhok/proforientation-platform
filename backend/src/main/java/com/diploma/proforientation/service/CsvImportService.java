package com.diploma.proforientation.service;

import com.diploma.proforientation.dto.importexport.ImportResultDto;
import org.springframework.web.multipart.MultipartFile;

public interface CsvImportService {
    ImportResultDto importQuestions(MultipartFile file);
    ImportResultDto importTranslations(MultipartFile file);
}
