# 다니랜드 SOOP 채팅 횟수 수집기

방송국 ID로 라이브를 15초마다 확인하고, SOOP 방송번호(BNO)별 일반 채팅과 이모티콘 이벤트를 집계합니다. 같은 말 반복과 연속 채팅도 각각 1회입니다. 날짜는 방송을 처음 발견한 시각의 한국 날짜로 고정하며, 자정을 지나도 같은 BNO로 유지됩니다.

## 설치

1. 실제 다니랜드 Readdy Backend (`k2tbnmtgvh34rdbxdjk2.helloreaddy.com`)에만 `schema.sql`을 적용합니다. 기존 `songpyeon_bridge_token_ok(text)` RPC를 확인하고 PostgREST 스키마 캐시를 갱신합니다. 외부 Supabase 프로젝트에는 적용하지 마세요.
2. `npm ci`를 실행합니다.
3. `.env.example`의 네 값을 Railway 서비스 환경변수로 등록합니다. `SUPABASE_ANON_KEY`는 게이트웨이 통과용이고, 새 RPC는 `SOOP_BRIDGE_TOKEN`을 검증합니다. 브릿지 토큰과 키 값은 코드와 공개 저장소에 넣지 마세요. `service_role` 키는 사용하지 않습니다.
   - Readdy SQL 러너에서 함수 단위 `REVOKE/GRANT`가 차단되어 운영 RPC의 기본 EXECUTE 권한이 열려 있습니다. 유효한 브릿지 토큰 없이는 기록할 수 없지만, 토큰이 유출되면 가짜 채팅 횟수를 넣을 수 있으므로 Railway 변수 접근을 제한하고 토큰을 공개하지 마세요.
4. Railway의 지속 실행 Worker로 `npm start`를 실행합니다. 공개 도메인과 cron은 필요 없습니다. 재시작 정책은 항상 재시작으로 설정합니다.

5초마다 유저별 증가량만 전송합니다. 배치 ID를 이용해 HTTP 응답 유실 뒤 재시도하더라도 같은 배치가 다시 더해지지 않도록 합니다. 수집기 자체가 멈췄거나 재시작될 때 아직 DB에 저장하지 못한 최대 몇 초간의 이벤트는 복원할 수 없습니다. SOOP 연결 끊김과 저장 실패 로그를 감시해야 합니다. 비공식 SOOP 라이브러리 기반이라 SOOP의 통신 방식 변경에 따라 수정이 필요할 수 있습니다.

## 방송 감지 시각 기록

운영 Readdy Backend에 `broadcast-detection-migration.sql`을 적용한 뒤 Railway 서비스에 `SOOP_RECORD_BROADCAST_TIMES=true`를 추가합니다. 새 BNO가 발견되면 `soop_chat_broadcasts.first_detected_at`에 감지 시각을 기록하고, SOOP 방송국 API의 `broad_no`가 같은 BNO일 때 제공되는 `station.broad_start`를 `soop_started_at`에 별도로 기록합니다. 두 시각은 Railway 로그에도 `YYYY-MM-DD HH:mm:ss KST`로 남깁니다. 시작 시각 조회 실패 시 방송 중 재시도하고, 기존 채팅 수집과 저장은 계속합니다.

`soop_started_at`은 **SOOP이 제공한 방송 시작 시각**입니다. 15초 간격 조회 시각을 시작 시각으로 대체하지 않습니다. SOOP 응답에 올바른 시각이 없거나 방송번호가 일치하지 않으면 이 칸을 비워 두며, `first_detected_at`을 시작 시각이라고 표시하지 않습니다. 기존 행의 `created_at`은 첫 배치 저장 시각입니다. 과거 방송에 시작 시각을 임의로 소급 입력하지 않습니다.

이번 단계는 횟수 수집 전용입니다. 1회당 10P, 1~3위 보너스, 다니랜드 회원과 SOOP 계정 연결, 공개 채팅왕 페이지는 이 데이터가 실제로 쌓이는 것을 검증한 후 별도로 구현합니다. 지급 전 수집 누락과 순위 동률 처리 기준을 확정하세요.
