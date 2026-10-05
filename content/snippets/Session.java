// illustrative java model for this page: not Nexus source.
// the lobby on the right walks these exact states; a test checks the transitions match.
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

enum SessionState {
    IDLE, HOSTING, INVITED, JOINING, VALIDATING, AUTHENTICATING, CONNECTED, REJECTED, CLOSED;

    Set<SessionState> next() {
        return switch (this) {
            case IDLE -> EnumSet.of(HOSTING);
            case HOSTING -> EnumSet.of(INVITED, CLOSED);
            case INVITED -> EnumSet.of(JOINING, CLOSED);
            case JOINING -> EnumSet.of(VALIDATING, REJECTED, CLOSED);
            case VALIDATING -> EnumSet.of(AUTHENTICATING, REJECTED, CLOSED);
            case AUTHENTICATING -> EnumSet.of(CONNECTED, CLOSED);
            case CONNECTED -> EnumSet.of(CLOSED);
            case REJECTED -> EnumSet.noneOf(SessionState.class);
            case CLOSED -> EnumSet.noneOf(SessionState.class);
        };
    }
}

enum Rejection { INVITE_EXPIRED, INVITE_ALREADY_USED, AUTH_FAILED }

/** a short token someone can type: valid once, and only for a little while. */
record Invite(String token, Instant expiresAt, boolean used) {
    static Invite issue(String token, Duration ttl) {
        return new Invite(token, Instant.now().plus(ttl), false);
    }

    /** empty means the invite is fine. expiry is checked before reuse. */
    Optional<Rejection> check(Instant now) {
        if (!now.isBefore(expiresAt)) return Optional.of(Rejection.INVITE_EXPIRED);
        if (used) return Optional.of(Rejection.INVITE_ALREADY_USED);
        return Optional.empty();
    }

    Invite consume() {
        return new Invite(token, expiresAt, true);
    }
}

final class Session {
    private SessionState state = SessionState.IDLE;
    private Invite invite;

    SessionState state() {
        return state;
    }

    void moveTo(SessionState target) {
        if (!state.next().contains(target)) {
            throw new IllegalStateException(state + " cannot go to " + target);
        }
        state = target;
    }

    void host() {
        moveTo(SessionState.HOSTING);
    }

    void createInvite(String token) {
        moveTo(SessionState.INVITED);
        invite = Invite.issue(token, Duration.ofSeconds(90));
    }

    void playerJoins() {
        moveTo(SessionState.JOINING);
    }

    /** the invite is checked and spent here, before anyone is trusted. */
    Optional<Rejection> validate(Instant now) {
        Optional<Rejection> problem = invite.check(now);
        if (problem.isPresent()) {
            moveTo(SessionState.REJECTED);
            return problem;
        }
        invite = invite.consume();
        moveTo(SessionState.VALIDATING);
        return Optional.empty();
    }

    Optional<Rejection> authenticate(boolean credentialsOk) {
        if (!credentialsOk) {
            moveTo(SessionState.REJECTED);
            return Optional.of(Rejection.AUTH_FAILED);
        }
        moveTo(SessionState.AUTHENTICATING);
        return Optional.empty();
    }

    void connect() {
        moveTo(SessionState.CONNECTED);
    }

    void hostOffline() {
        moveTo(SessionState.CLOSED);
    }
}
