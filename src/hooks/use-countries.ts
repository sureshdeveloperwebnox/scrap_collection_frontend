import { useQuery } from '@tanstack/react-query';
import { countriesApi } from '@/lib/api/countries';

export const useGetCountries = () => {
    return useQuery({
        queryKey: ['countries'],
        queryFn: () => countriesApi.getCountries(),
        staleTime: 1000 * 60 * 60, // Cache for 1 hour since countries don't change often
    });
};
