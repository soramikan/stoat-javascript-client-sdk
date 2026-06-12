import type { Embed, ImageSize, Special } from "stoat-api";

import type { Client } from "../Client.js";

import { File } from "./File.js";

/**
 * Message Embed
 */
export abstract class MessageEmbed {
  protected client?: Client;
  readonly type: Embed["type"];

  /**
   * Construct Embed
   * @param client Client
   * @param type Type
   */
  constructor(client?: Client, type: Embed["type"] = "None") {
    this.client = client;
    this.type = type;
  }

  /**
   * Create an Embed from an API Embed
   * @param client Client
   * @param embed Data
   * @returns Embed
   */
  static from(client: Client, embed: Embed): MessageEmbed {
    switch (embed.type) {
      case "Image":
        return new ImageEmbed(client, embed);
      case "Video":
        return new VideoEmbed(client, embed);
      case "Website":
        return new WebsiteEmbed(client, embed);
      case "Text":
        return new TextEmbed(client, embed);
      default:
        return new UnknownEmbed(client);
    }
  }
}

/**
 * Embed of unknown type
 */
export class UnknownEmbed extends MessageEmbed {}

/**
 * Image Embed
 */
export class ImageEmbed extends MessageEmbed {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly size: ImageSize;

  /**
   * Construct Image Embed
   * @param client Client
   * @param embed Embed
   */
  constructor(client: Client, embed: Omit<Embed & { type: "Image" }, "type">) {
    super(client, "Image");

    this.url = embed.url;
    this.width = embed.width;
    this.height = embed.height;
    this.size = embed.size;
  }

  /**
   * Proxied image URL
   */
  get proxiedURL(): string | undefined {
    return this.client?.proxyFile(this.url);
  }
}

/**
 * Video Embed
 */
export class VideoEmbed extends MessageEmbed {
  readonly url: string;
  readonly width: number;
  readonly height: number;

  /**
   * Construct Video Embed
   * @param client Client
   * @param embed Embed
   */
  constructor(client: Client, embed: Omit<Embed & { type: "Video" }, "type">) {
    super(client, "Video");

    this.url = embed.url;
    this.width = embed.width;
    this.height = embed.height;
  }

  /**
   * Proxied video URL
   */
  get proxiedURL(): string | undefined {
    return this.client?.proxyFile(this.url);
  }
}

/**
 * Website Embed
 */
export class WebsiteEmbed extends MessageEmbed {
  readonly url?: string;
  readonly originalUrl?: string;
  readonly specialContent?: Special;
  readonly title?: string;
  readonly description?: string;
  readonly image?: ImageEmbed;
  readonly video?: VideoEmbed;
  readonly siteName?: string;
  readonly iconUrl?: string;
  readonly colour?: string;

  /**
   * Construct Video Embed
   * @param client Client
   * @param embed Embed
   */
  constructor(
    client: Client,
    embed: Omit<Embed & { type: "Website" }, "type">,
  ) {
    super(client, "Website");

    this.url = embed.url!;
    this.originalUrl = embed.original_url!;
    this.specialContent = embed.special!;
    this.title = embed.title!;
    this.description = embed.description!;
    this.image = embed.image ? new ImageEmbed(client, embed.image) : undefined;
    this.video = embed.video ? new VideoEmbed(client, embed.video) : undefined;
    this.siteName = embed.site_name!;
    this.iconUrl = embed.icon_url!;
    this.colour = embed.colour!;
  }

  /**
   * Proxied icon URL
   */
  get proxiedIconURL(): string | undefined {
    return this.iconUrl ? this.client?.proxyFile(this.iconUrl) : undefined;
  }

  /**
   * If special content is present, generate the embed URL
   */
  get embedURL(): string | undefined {
    switch (this.specialContent?.type) {
      case "YouTube": {
        let timestamp = "";

        if (this.specialContent.timestamp) {
          timestamp = `&start=${this.specialContent.timestamp}`;
        }

        return `https://www.youtube-nocookie.com/embed/${this.specialContent.id}?modestbranding=1${timestamp}`;
      }
      case "Twitch":
        return `https://player.twitch.tv/?${this.specialContent.content_type.toLowerCase()}=${
          this.specialContent.id
        }&parent=${(window ?? {})?.location?.hostname}&autoplay=false`;
      case "Lightspeed":
        return `https://new.lightspeed.tv/embed/${this.specialContent.id}/stream`;
      case "Spotify":
        return `https://open.spotify.com/embed/${this.specialContent.content_type}/${this.specialContent.id}`;
      case "Soundcloud":
        return `https://w.soundcloud.com/player/?url=${encodeURIComponent(
          this.url!,
        )}&color=%23FF7F50&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
      case "Bandcamp": {
        return `https://bandcamp.com/EmbeddedPlayer/${this.specialContent.content_type.toLowerCase()}=${
          this.specialContent.id
        }/size=large/bgcol=181a1b/linkcol=056cc4/tracklist=false/transparent=true/`;
      }
      case "Streamable": {
        return `https://streamable.com/e/${this.specialContent.id}?loop=0`;
      }
    }
  }
}

/**
 * Text Embed
 */
export class TextEmbed extends MessageEmbed {
  readonly iconUrl?: string;
  readonly url?: string;
  readonly title?: string;
  readonly description?: string;
  readonly media?: File;
  readonly colour?: string;
  readonly color?: number;
  readonly author?: DiscordEmbedAuthor;
  readonly footer?: DiscordEmbedFooter;
  readonly fields?: DiscordEmbedField[];
  readonly image?: DiscordEmbedAsset;
  readonly thumbnail?: DiscordEmbedAsset;
  readonly timestamp?: Date;

  /**
   * Construct Video Embed
   * @param client Client
   * @param embed Embed
   */
  constructor(client: Client, embed: TextEmbedData) {
    super(client, "Text");

    this.iconUrl = embed.icon_url!;
    this.url = embed.url!;
    this.title = embed.title!;
    this.description = embed.description!;
    this.media = embed.media ? new File(client, embed.media) : undefined;
    this.colour = embed.colour!;
    this.color = embed.color;
    this.author = embed.author;
    this.footer = embed.footer;
    this.fields = embed.fields;
    this.image = embed.image;
    this.thumbnail = embed.thumbnail;
    this.timestamp = embed.timestamp ? new Date(embed.timestamp) : undefined;
  }

  /**
   * Proxied icon URL
   */
  get proxiedIconURL(): string | undefined {
    return this.iconUrl ? this.client?.proxyFile(this.iconUrl) : undefined;
  }

  /**
   * CSS colour derived from Discord's integer colour field.
   */
  get colorHex(): string | undefined {
    return typeof this.color === "number"
      ? `#${this.color.toString(16).padStart(6, "0")}`
      : undefined;
  }

  /**
   * Proxied URL for Discord-compatible large image.
   */
  get proxiedImageURL(): string | undefined {
    return this.image?.proxy_url ?? this.proxyOptionalURL(this.image?.url);
  }

  /**
   * Proxied URL for Discord-compatible thumbnail.
   */
  get proxiedThumbnailURL(): string | undefined {
    return (
      this.thumbnail?.proxy_url ?? this.proxyOptionalURL(this.thumbnail?.url)
    );
  }

  /**
   * Proxied URL for Discord-compatible author icon.
   */
  get proxiedAuthorIconURL(): string | undefined {
    return (
      this.author?.proxy_icon_url ??
      this.proxyOptionalURL(this.author?.icon_url)
    );
  }

  /**
   * Proxied URL for Discord-compatible footer icon.
   */
  get proxiedFooterIconURL(): string | undefined {
    return (
      this.footer?.proxy_icon_url ??
      this.proxyOptionalURL(this.footer?.icon_url)
    );
  }

  private proxyOptionalURL(url?: string): string | undefined {
    return url ? this.client?.proxyFile(url) : undefined;
  }
}

export interface DiscordEmbedAsset {
  url: string;
  proxy_url?: string;
  width?: number;
  height?: number;
}

export interface DiscordEmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface DiscordEmbedFooter {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

type TextEmbedData = Omit<Embed & { type: "Text" }, "type"> & {
  color?: number;
  author?: DiscordEmbedAuthor;
  footer?: DiscordEmbedFooter;
  fields?: DiscordEmbedField[];
  image?: DiscordEmbedAsset;
  thumbnail?: DiscordEmbedAsset;
  timestamp?: string;
};
