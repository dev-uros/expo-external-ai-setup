import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import type { PropsWithChildren } from 'react';
import { Linking } from 'react-native';

import { ApiError } from '@/lib/http';
import { removeAvatar, uploadAvatar } from '@/features/profile/api/avatar';
import { useAvatarEditor } from '@/features/profile/hooks/use-avatar-editor';
import type { User } from '@/features/shared/schemas/user';
import { useSessionStore } from '@/features/shared/stores/session';
import { useToastStore } from '@/features/shared/stores/toast';

jest.mock('@/features/profile/api/avatar', () => ({
  uploadAvatar: jest.fn(),
  removeAvatar: jest.fn(),
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  CameraType: { front: 'front', back: 'back' },
}));

const picker = ImagePicker as jest.Mocked<typeof ImagePicker>;
const uploadMock = uploadAvatar as jest.MockedFunction<typeof uploadAvatar>;
const removeMock = removeAvatar as jest.MockedFunction<typeof removeAvatar>;

const user: User = {
  id: 4,
  name: 'Ana',
  surname: 'Nikolić',
  email: 'ana@firma.com',
  role: 'user',
  avatar_url: null,
  deactivated_at: null,
  email_verified_at: '2026-01-01T10:00:00+00:00',
  created_at: '2026-01-01T10:00:00+00:00',
  updated_at: '2026-01-01T10:00:00+00:00',
};

const photo = {
  uri: 'file:///cache/cropped.jpg',
  mimeType: 'image/jpeg',
  fileSize: 300_000,
  width: 800,
  height: 800,
};

function picked(asset = photo) {
  return { canceled: false, assets: [asset] } as ImagePicker.ImagePickerResult;
}

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function renderEditor(account: User = user) {
  const { result } = await renderHook(() => useAvatarEditor(account), { wrapper });
  return result;
}

const granted = { granted: true, canAskAgain: true } as ImagePicker.PermissionResponse;

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.setState({ status: 'signedIn', user });
  useToastStore.setState({ toast: null });
});

describe('choosing from the library', () => {
  test('asks for no permission at all — the system picker hands over one photo', async () => {
    picker.launchImageLibraryAsync.mockResolvedValueOnce(picked());
    uploadMock.mockResolvedValueOnce({ message: 'Ažurirano.', data: user });
    const editor = await renderEditor();

    await act(() => editor.current.chooseFromLibrary());

    expect(picker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
    expect(picker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1] })
    );
  });

  test('a picked photo is uploaded, lands in the session and is confirmed with a toast', async () => {
    const updated = { ...user, avatar_url: 'http://api.test/storage/avatars/new.webp' };
    picker.launchImageLibraryAsync.mockResolvedValueOnce(picked());
    uploadMock.mockResolvedValueOnce({ message: 'Profilna slika je ažurirana.', data: updated });
    const editor = await renderEditor();

    await act(() => editor.current.chooseFromLibrary());

    expect(uploadMock).toHaveBeenCalledWith(4, photo);
    await waitFor(() => expect(useSessionStore.getState().user).toEqual(updated));
    expect(useToastStore.getState().toast?.message).toBe('Profilna slika je ažurirana.');
  });

  test('cancelling the picker changes nothing', async () => {
    picker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: true,
      assets: null,
    } as ImagePicker.ImagePickerResult);
    const editor = await renderEditor();

    await act(() => editor.current.chooseFromLibrary());

    expect(uploadMock).not.toHaveBeenCalled();
    expect(editor.current.error).toBeNull();
  });

  test('a picture the server would refuse is stopped before uploading', async () => {
    picker.launchImageLibraryAsync.mockResolvedValueOnce(
      picked({ ...photo, fileSize: 6 * 1024 * 1024 })
    );
    const editor = await renderEditor();

    await act(() => editor.current.chooseFromLibrary());

    expect(uploadMock).not.toHaveBeenCalled();
    expect(editor.current.error).toBe('Slika ne sme biti veća od 5 MB.');
  });

  test('the server’s refusal is shown as it arrived', async () => {
    picker.launchImageLibraryAsync.mockResolvedValueOnce(picked());
    uploadMock.mockRejectedValueOnce(
      new ApiError(422, 'The avatar field has invalid image dimensions.', 'r', {
        avatar: ['The avatar field has invalid image dimensions.'],
      })
    );
    const editor = await renderEditor();

    await act(() => editor.current.chooseFromLibrary());

    await waitFor(() =>
      expect(editor.current.error).toBe('The avatar field has invalid image dimensions.')
    );
  });
});

describe('taking a photo', () => {
  test('asks for the camera, then opens it on the front camera', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValueOnce(granted);
    picker.launchCameraAsync.mockResolvedValueOnce(picked());
    uploadMock.mockResolvedValueOnce({ message: 'Ažurirano.', data: user });
    const editor = await renderEditor();

    await act(() => editor.current.takePhoto());

    expect(picker.launchCameraAsync).toHaveBeenCalledWith(
      expect.objectContaining({ cameraType: 'front', allowsEditing: true })
    );
    expect(uploadMock).toHaveBeenCalledWith(4, photo);
  });

  test('a refusal the system will ask about again just does nothing', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValueOnce({
      granted: false,
      canAskAgain: true,
    } as ImagePicker.PermissionResponse);
    const editor = await renderEditor();

    await act(() => editor.current.takePhoto());

    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
    expect(editor.current.dialog).toBeNull();
  });

  test('a permanent refusal offers the settings app instead of a dead button', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValueOnce({
      granted: false,
      canAskAgain: false,
    } as ImagePicker.PermissionResponse);
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const editor = await renderEditor();

    await act(() => editor.current.takePhoto());
    expect(editor.current.dialog).toBe('cameraBlocked');

    await act(() => editor.current.openSettings());
    expect(openSettings).toHaveBeenCalled();
    expect(editor.current.dialog).toBeNull();
  });
});

describe('removing the picture', () => {
  const withPicture = { ...user, avatar_url: 'http://api.test/storage/avatars/x.webp' };

  test('is offered only when there is a picture', async () => {
    expect((await renderEditor(user)).current.canRemove).toBe(false);
    expect((await renderEditor(withPicture)).current.canRemove).toBe(true);
  });

  test('asks first, and only confirming removes it', async () => {
    removeMock.mockResolvedValueOnce({ message: 'Profilna slika je uklonjena.', data: user });
    const editor = await renderEditor(withPicture);

    await act(() => editor.current.requestRemove());
    expect(editor.current.dialog).toBe('confirmRemove');
    expect(removeMock).not.toHaveBeenCalled();

    await act(() => editor.current.confirmRemove());

    expect(removeMock).toHaveBeenCalledWith(4);
    await waitFor(() =>
      expect(useToastStore.getState().toast?.message).toBe('Profilna slika je uklonjena.')
    );
  });

  test('cancelling keeps the picture', async () => {
    const editor = await renderEditor(withPicture);

    await act(() => editor.current.requestRemove());
    await act(() => editor.current.dismissDialog());

    expect(removeMock).not.toHaveBeenCalled();
    expect(editor.current.dialog).toBeNull();
  });
});
