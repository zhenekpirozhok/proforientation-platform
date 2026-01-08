package com.diploma.proforientation.service;


import com.diploma.proforientation.dto.importexport.ImportResultDto;
import org.springframework.web.multipart.MultipartFile;

public interface ImportService {
    ImportResultDto importTranslations(MultipartFile file);
    ImportResultDto importQuizzes(MultipartFile file);
    ImportResultDto importProfessions(MultipartFile file);
    ImportResultDto importQuestions(MultipartFile file);
}