<?php
/**
 * Plugin Name: CHGA Push Webhook
 * Description: Sends a Netlify webhook when a new WordPress post is published.
 * Version: 0.1.0
 * Author: CHGA
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

const CHGA_PUSH_WEBHOOK_OPTION_URL = 'chga_push_webhook_url';
const CHGA_PUSH_WEBHOOK_OPTION_SECRET = 'chga_push_webhook_secret';

add_action('admin_menu', 'chga_push_webhook_add_settings_page');
add_action('admin_init', 'chga_push_webhook_register_settings');
add_action('transition_post_status', 'chga_push_webhook_on_publish', 10, 3);

function chga_push_webhook_add_settings_page(): void
{
    add_options_page(
        'CHGA Push Webhook',
        'CHGA Push Webhook',
        'manage_options',
        'chga-push-webhook',
        'chga_push_webhook_render_settings_page'
    );
}

function chga_push_webhook_register_settings(): void
{
    register_setting('chga_push_webhook', CHGA_PUSH_WEBHOOK_OPTION_URL, [
        'type' => 'string',
        'sanitize_callback' => 'esc_url_raw',
        'default' => '',
    ]);

    register_setting('chga_push_webhook', CHGA_PUSH_WEBHOOK_OPTION_SECRET, [
        'type' => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default' => '',
    ]);
}

function chga_push_webhook_render_settings_page(): void
{
    if (!current_user_can('manage_options')) {
        return;
    }

    ?>
    <div class="wrap">
        <h1>CHGA Push Webhook</h1>
        <p>Configure le webhook Netlify appelé quand une nouvelle est publiée.</p>

        <form method="post" action="options.php">
            <?php settings_fields('chga_push_webhook'); ?>

            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row">
                        <label for="<?php echo esc_attr(CHGA_PUSH_WEBHOOK_OPTION_URL); ?>">Webhook URL</label>
                    </th>
                    <td>
                        <input
                            id="<?php echo esc_attr(CHGA_PUSH_WEBHOOK_OPTION_URL); ?>"
                            name="<?php echo esc_attr(CHGA_PUSH_WEBHOOK_OPTION_URL); ?>"
                            type="url"
                            class="regular-text"
                            value="<?php echo esc_attr(get_option(CHGA_PUSH_WEBHOOK_OPTION_URL)); ?>"
                            placeholder="https://chgamobile.netlify.app/api/push-webhook"
                            required
                        />
                    </td>
                </tr>
                <tr>
                    <th scope="row">
                        <label for="<?php echo esc_attr(CHGA_PUSH_WEBHOOK_OPTION_SECRET); ?>">Webhook secret</label>
                    </th>
                    <td>
                        <input
                            id="<?php echo esc_attr(CHGA_PUSH_WEBHOOK_OPTION_SECRET); ?>"
                            name="<?php echo esc_attr(CHGA_PUSH_WEBHOOK_OPTION_SECRET); ?>"
                            type="password"
                            class="regular-text"
                            value="<?php echo esc_attr(get_option(CHGA_PUSH_WEBHOOK_OPTION_SECRET)); ?>"
                            autocomplete="new-password"
                        />
                        <p class="description">Doit correspondre à la variable Netlify CHGA_PUSH_WEBHOOK_SECRET.</p>
                    </td>
                </tr>
            </table>

            <?php submit_button('Enregistrer'); ?>
        </form>
    </div>
    <?php
}

function chga_push_webhook_on_publish(string $new_status, string $old_status, WP_Post $post): void
{
    if ($new_status !== 'publish' || $old_status === 'publish') {
        return;
    }

    if ($post->post_type !== 'post') {
        return;
    }

    if (wp_is_post_revision($post->ID) || wp_is_post_autosave($post->ID)) {
        return;
    }

    $webhook_url = get_option(CHGA_PUSH_WEBHOOK_OPTION_URL);
    if (!$webhook_url) {
        return;
    }

    $secret = get_option(CHGA_PUSH_WEBHOOK_OPTION_SECRET);
    $app_base_url = apply_filters('chga_push_webhook_app_base_url', 'https://chgamobile.netlify.app/');
    $app_article_url = add_query_arg('article', $post->post_name, $app_base_url);
    $payload = [
        'title' => get_the_title($post),
        'excerpt' => chga_push_webhook_get_excerpt($post),
        'url' => $app_article_url,
        'sourceUrl' => get_permalink($post),
        'imageUrl' => get_the_post_thumbnail_url($post, 'large') ?: '',
        'postId' => $post->ID,
        'publishedAt' => get_post_time(DATE_ATOM, true, $post),
    ];

    $headers = [
        'Content-Type' => 'application/json',
    ];

    if ($secret) {
        $headers['x-chga-secret'] = $secret;
    }

    $response = wp_remote_post($webhook_url, [
        'timeout' => 8,
        'headers' => $headers,
        'body' => wp_json_encode($payload),
    ]);

    if (is_wp_error($response)) {
        error_log('CHGA Push Webhook error: ' . $response->get_error_message());
        return;
    }

    $status_code = wp_remote_retrieve_response_code($response);
    if ($status_code < 200 || $status_code >= 300) {
        error_log('CHGA Push Webhook returned HTTP ' . $status_code . ': ' . wp_remote_retrieve_body($response));
    }
}

function chga_push_webhook_get_excerpt(WP_Post $post): string
{
    if ($post->post_excerpt) {
        return wp_strip_all_tags($post->post_excerpt);
    }

    $content = wp_strip_all_tags(strip_shortcodes($post->post_content));
    return wp_trim_words($content, 28, '...');
}
