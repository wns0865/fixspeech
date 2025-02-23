package com.fixspeech.spring_server.filter;

import java.io.IOException;
import java.util.Arrays;

import org.apache.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fixspeech.spring_server.global.common.JwtTokenProvider;
import com.fixspeech.spring_server.global.exception.CustomException;
import com.fixspeech.spring_server.global.exception.ErrorCode;
import com.fixspeech.spring_server.utils.ErrorResponseUtil;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtTokenProvider jwtTokenProvider;
	private final String[] WHITE_LIST = {
		"/login", "/user/public/reissue"
	};

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
		FilterChain filterChain) throws ServletException, IOException {

		String jwt = getJwtFromRequest(request);
		try {
			if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
				Authentication auth = jwtTokenProvider.getAuthentication(jwt);
				SecurityContextHolder.getContext().setAuthentication(auth);
			}
		} catch (CustomException e) {
			SecurityContextHolder.clearContext();
			ErrorResponseUtil.sendErrorResponse(response, ErrorCode.ACCESS_TOKEN_EXPIRED);
			return;
		} catch (JwtException e) {
			SecurityContextHolder.clearContext();
			ErrorResponseUtil.sendErrorResponse(response, ErrorCode.INVALID_JWT_TOKEN);
			return;
		}
		filterChain.doFilter(request, response);
	}

	// 토큰 정보 추출
	private String getJwtFromRequest(HttpServletRequest request) {
		String bearerToken = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
			return bearerToken.split(" ")[1].trim();
		}
		return null;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
		String path = request.getServletPath();
		return Arrays.asList(WHITE_LIST).contains(path);
	}
}
