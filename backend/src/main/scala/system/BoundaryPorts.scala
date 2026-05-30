package omegalog.system

import cats.effect.IO

import java.time.Instant

trait SystemClock:
  def now: IO[Instant]

object SystemClock:
  val realTime: SystemClock =
    new SystemClock:
      override def now: IO[Instant] =
        IO.delay(Instant.now())

trait IdGenerator[A]:
  def nextId: IO[A]

object IdGenerator:
  def fromIO[A](generate: IO[A]): IdGenerator[A] =
    new IdGenerator[A]:
      override def nextId: IO[A] =
        generate

  def constant[A](value: A): IdGenerator[A] =
    new IdGenerator[A]:
      override def nextId: IO[A] =
        IO.pure(value)
