import { createClient } from '@supabase/supabase-js';
export async function addUrl(username: string, url: string) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
        .from('utilisateurs')
        .upsert(
            { identifiant: username, lienAgenda: url },
            { onConflict: 'identifiant' }
        );

    if (error) {
        throw new Error("Erreur", error);

    } else if (data) {
        return data;
    }
};

export async function getUrl(username: string) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
        .from('utilisateurs')
        .select("lienAgenda")
        .eq('identifiant', username)
        .single();

    if (error) {
        throw new Error("Erreur", error);

    } else if (data) {
        return data;
    }
}
