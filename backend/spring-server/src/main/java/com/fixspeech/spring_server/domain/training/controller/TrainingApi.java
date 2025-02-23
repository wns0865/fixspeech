package com.fixspeech.spring_server.domain.training.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

// Training API Interface
@Tag(name = "발음 훈련", description = "발음 훈련 관련 API")
public interface TrainingApi {
	@Operation(summary = "훈련 문장 조회 API", description = "훈련용 문장을 조회하는 API")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "문장 조회 성공"),
		@ApiResponse(responseCode = "500", description = "서버 내부 오류")
	})
	com.fixspeech.spring_server.global.common.ApiResponse<?> start(@AuthenticationPrincipal UserDetails userDetails,
		Long trainingId);

	@Operation(summary = "훈련 문장 종료 API", description = "훈련용 문장을 종료하는 API")
	@ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "문장 종료 성공"),
		@ApiResponse(responseCode = "500", description = "서버 내부 오류")
	})
	com.fixspeech.spring_server.global.common.ApiResponse<?> end(@AuthenticationPrincipal UserDetails userDetails);

}