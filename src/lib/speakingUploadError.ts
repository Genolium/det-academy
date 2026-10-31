import { ApiError } from './api';

/** The server already has this audio response, so a retry must count as success. */
export function isAudioAlreadyStored(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409 && error.code === 'already_answered';
}

export function speakingUploadErrorMessage(error: unknown, ru: boolean): string {
  if (!(error instanceof ApiError)) {
    return ru
      ? 'Не удалось сохранить аудио. Проверьте соединение и повторите.'
      : 'Could not save the audio. Check your connection and try again.';
  }
  if (error.status === 410 || error.code === 'deadline_exceeded') {
    return ru
      ? 'Время задания истекло, поэтому аудио не принято. Можно продолжить без него.'
      : 'The task time ran out, so the audio was not accepted. You can continue without it.';
  }
  if (error.status === 413) {
    return ru
      ? 'Запись слишком большая для загрузки. Можно записать короче или продолжить без аудио.'
      : 'The recording is too large to upload. Record a shorter answer or continue without audio.';
  }
  if (error.status === 429) {
    return ru
      ? 'На сегодня достигнут лимит разговорных заданий. Можно продолжить без аудио.'
      : 'The daily speaking limit is reached. You can continue without audio.';
  }
  if (error.status === 401 || error.status === 403) {
    return ru
      ? 'Сессия истекла. Аудио не сохранено, но тест можно продолжить.'
      : 'The session expired. The audio was not saved, but you can continue the test.';
  }
  if (error.status === 0) {
    return ru
      ? 'Соединение прервалось. Можно повторить отправку или продолжить без аудио.'
      : 'The connection dropped. Retry the upload or continue without audio.';
  }
  return ru
    ? 'Сервер не принял аудио. Можно повторить отправку или продолжить без аудио.'
    : 'The server did not accept the audio. Retry the upload or continue without audio.';
}
