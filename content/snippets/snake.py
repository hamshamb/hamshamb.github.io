"""snake, the terminal version. run it with: python snake.py

the rules are the ones snake.ts uses in the browser: walls kill, your own body
kills, no reversing into your neck, and every apple makes it a little faster
(down to a floor). the browser version adds a combo, a rare bonus and a skin.
"""
import curses
import random
from collections import deque

UP, DOWN, LEFT, RIGHT = (-1, 0), (1, 0), (0, -1), (0, 1)
KEYS = {
    curses.KEY_UP: UP, ord("w"): UP,
    curses.KEY_DOWN: DOWN, ord("s"): DOWN,
    curses.KEY_LEFT: LEFT, ord("a"): LEFT,
    curses.KEY_RIGHT: RIGHT, ord("d"): RIGHT,
}


def place_food(rows, cols, snake):
    free = [(r, c) for r in range(1, rows - 1) for c in range(1, cols - 1)
            if (r, c) not in snake]
    return random.choice(free)


def play(screen):
    curses.curs_set(0)
    rows, cols = 18, 36
    win = curses.newwin(rows, cols, 0, 0)
    win.keypad(True)

    snake = deque([(9, 10), (9, 9), (9, 8)])
    direction = RIGHT
    food = place_food(rows, cols, snake)
    score, delay = 0, 140

    while True:
        win.erase()
        win.border()
        win.addstr(0, 2, f" score {score} ")
        win.addch(food[0], food[1], "*")
        for r, c in snake:
            win.addch(r, c, "#")
        win.timeout(delay)

        turn = KEYS.get(win.getch())
        # ignore a turn straight back into your own neck
        if turn and (turn[0] + direction[0], turn[1] + direction[1]) != (0, 0):
            direction = turn

        head = (snake[0][0] + direction[0], snake[0][1] + direction[1])
        hit_wall = head[0] in (0, rows - 1) or head[1] in (0, cols - 1)
        if hit_wall or head in snake:
            return score

        snake.appendleft(head)
        if head == food:
            score += 1
            delay = max(60, delay - 4)  # a little faster every time
            food = place_food(rows, cols, snake)
        else:
            snake.pop()


if __name__ == "__main__":
    final = curses.wrapper(play)
    print(f"game over. score: {final}")
