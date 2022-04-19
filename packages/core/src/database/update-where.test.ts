import { CreateUser, Users, Applications } from '@logto/schemas';

import envSet from '@/env-set';
import { UpdateError } from '@/errors/SlonikError';
import { createTestPool } from '@/utils/test-utils';

import { buildUpdateWhere } from './update-where';

describe('buildUpdateWhere()', () => {
  it('resolves a promise with `undefined` when `returning` is false', async () => {
    const pool = createTestPool(
      'update "users"\nset "username"=$1\nwhere "id"=$2 and "username"=$3'
    );
    jest.spyOn(envSet, 'pool', 'get').mockReturnValue(pool);

    const updateWhere = buildUpdateWhere(Users);
    await expect(
      updateWhere({
        set: { username: '123' },
        where: { id: 'foo', username: '456' },
      })
    ).resolves.toBe(undefined);
  });

  it('resolves a promise with single entity when `returning` is true', async () => {
    const user: CreateUser = { id: 'foo', username: '123', primaryEmail: 'foo@bar.com' };
    const pool = createTestPool(
      'update "users"\nset "username"=$1, "primary_email"=$2\nwhere "id"=$3\nreturning *',
      (_, [username, primaryEmail, id]) => ({
        id: String(id),
        username: String(username),
        primaryEmail: String(primaryEmail),
      })
    );
    jest.spyOn(envSet, 'pool', 'get').mockReturnValue(pool);

    const updateWhere = buildUpdateWhere(Users, true);
    await expect(
      updateWhere({ set: { username: '123', primaryEmail: 'foo@bar.com' }, where: { id: 'foo' } })
    ).resolves.toStrictEqual(user);
  });

  it('return query with jsonb partial update if input data type is jsonb', async () => {
    const pool = createTestPool(
      'update "applications"\nset\n"custom_client_metadata"=\ncoalesce("custom_client_metadata",\'{}\'::jsonb)|| $1\nwhere "id"=$2\nreturning *',
      (_, [customClientMetadata, id]) => ({
        id: String(id),
        customClientMetadata: String(customClientMetadata),
      })
    );
    jest.spyOn(envSet, 'pool', 'get').mockReturnValue(pool);

    const updateWhere = buildUpdateWhere(Applications, true);
    await expect(
      updateWhere({
        set: { customClientMetadata: { idTokenTtl: 3600 } },
        where: { id: 'foo' },
      })
    ).resolves.toStrictEqual({ id: 'foo', customClientMetadata: '{"idTokenTtl":3600}' });
  });

  it('throws an error when `undefined` found in values', async () => {
    const pool = createTestPool(
      'update "users"\nset "username"=$1\nwhere "id"=$2 and "username"=$3'
    );
    jest.spyOn(envSet, 'pool', 'get').mockReturnValue(pool);

    const updateWhere = buildUpdateWhere(Users);

    await expect(
      updateWhere({
        set: { username: '123', id: undefined },
        where: { id: 'foo', username: '456' },
      })
    ).rejects.toMatchError(new Error(`Cannot convert id to primitive`));
  });

  it('throws `entity.not_exists_with_id` error with `undefined` when `returning` is true', async () => {
    const pool = createTestPool('update "users"\nset "username"=$1\nwhere "id"=$2\nreturning *');
    jest.spyOn(envSet, 'pool', 'get').mockReturnValue(pool);

    const updateWhere = buildUpdateWhere(Users, true);
    const updateWhereData = { set: { username: '123' }, where: { id: 'foo' } };

    await expect(updateWhere(updateWhereData)).rejects.toMatchError(
      new UpdateError(Users, updateWhereData)
    );
  });

  it('throws `UpdateError` error when `returning` is true and no id in where clause', async () => {
    const pool = createTestPool(
      'update "users"\nset "username"=$1\nwhere "username"=$2\nreturning *'
    );
    jest.spyOn(envSet, 'pool', 'get').mockReturnValue(pool);

    const updateWhere = buildUpdateWhere(Users, true);
    const updateData = { set: { username: '123' }, where: { username: 'foo' } };

    await expect(updateWhere(updateData)).rejects.toMatchError(new UpdateError(Users, updateData));
  });
});
