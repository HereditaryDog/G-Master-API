/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useRef } from 'react';
import { Button, Form } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';

const OAuthLoginsFilters = ({
  filters,
  searchOAuthLogins,
  resetFilters,
  loading,
  searching,
  t,
}) => {
  const formApiRef = useRef(null);
  const statusOptions = [
    { label: t('有效'), value: 'active' },
    { label: t('已过期'), value: 'expired' },
    { label: t('已撤销'), value: 'revoked' },
  ];

  const submitSearch = () => {
    const values = formApiRef.current?.getValues() || {};
    searchOAuthLogins({
      keyword: values.keyword || '',
      status: values.status || '',
    });
  };

  const handleReset = () => {
    formApiRef.current?.reset();
    resetFilters();
  };

  return (
    <Form
      initValues={filters}
      getFormApi={(api) => {
        formApiRef.current = api;
      }}
      onSubmit={submitSearch}
      allowEmpty={true}
      autoComplete='off'
      layout='horizontal'
      trigger='change'
      stopValidateWithError={false}
      className='w-full md:w-auto'
    >
      <div className='flex flex-col md:flex-row items-center gap-2 w-full md:w-auto'>
        <div className='relative w-full md:w-72'>
          <Form.Input
            field='keyword'
            prefix={<IconSearch />}
            placeholder={t('搜索用户、邮箱、ID 或客户端')}
            showClear
            pure
            size='small'
          />
        </div>
        <div className='w-full md:w-40'>
          <Form.Select
            field='status'
            placeholder={t('授权状态')}
            optionList={statusOptions}
            showClear
            pure
            size='small'
            className='w-full'
          />
        </div>
        <div className='flex gap-2 w-full md:w-auto'>
          <Button
            type='tertiary'
            htmlType='submit'
            loading={loading || searching}
            className='flex-1 md:flex-initial md:w-auto'
            size='small'
          >
            {t('查询')}
          </Button>
          <Button
            type='tertiary'
            onClick={handleReset}
            className='flex-1 md:flex-initial md:w-auto'
            size='small'
          >
            {t('重置')}
          </Button>
        </div>
      </div>
    </Form>
  );
};

export default OAuthLoginsFilters;
