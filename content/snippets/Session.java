// an illustrative model written for this page, not Nexus source.
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

enum SessionState {
    IDLE, HOSTING, INVITED, AUTHENTICATING, CONNECTED, CLOSED;

    Set<SessionState> next() {
        return switch (this) {
            case IDLE -> EnumSet.of(HOSTING, INVITED);
            case HOSTING -> EnumSet.of(AUTHENTICATING, CLOSED);
            case INVITED -> EnumSet.of(AUTHENTICATING, CLOSED);
            case AUTHENTICATING -> EnumSet.of(CONNECTED, CLOSED);
            case CONNECTED -> EnumSet.of(CLOSED);
            case CLOSED -> EnumSet.noneOf(SessionState.class);
        };
    }
}

/** a short code someone can type, valid once and only for a few minutes. */
record Invite(String code, Instant expiresAt, boolean used) {
    static Invite issue(String code, Duration ttl) {
        return new Invite(code, Instant.now().plus(ttl), false);
    }

    boolean accepts(String attempt, Instant now) {
        return !used && now.isBefore(expiresAt) && code.equals(attempt);
    }

    Invite consume() {
        return new Invite(code, expiresAt, true);
    }
}

final class Session {
    private SessionState state = SessionState.IDLE;

    SessionState state() {
        return state;
    }

    void moveTo(SessionState target) {
        if (!state.next().contains(target)) {
            throw new IllegalStateException(state + " cannot go to " + target);
        }
        state = target;
    }
}
