#!/bin/bash

# 🚀 Pengeluaranqu Quick Deploy Script
# Script untuk deploy aplikasi ke GitHub Pages

echo "🚀 Starting Pengeluaranqu deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "git init"
    echo "git branch -M main"
    exit 1
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Git remote 'origin' not found. Please add your GitHub repository:"
    echo "git remote add origin https://github.com/[USERNAME]/pengeluaranqu.git"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Found uncommitted changes. Adding all files..."
    git add .
    
    # Prompt for commit message
    echo "Enter commit message (or press Enter for default):"
    read -r commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="Update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    echo "💾 Committing changes: $commit_message"
    git commit -m "$commit_message"
else
    echo "✅ No uncommitted changes found."
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
if git push origin main; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "❌ Failed to push to GitHub. Please check your credentials and remote URL."
    exit 1
fi

# Get repository info
remote_url=$(git remote get-url origin)
if [[ $remote_url == *"github.com"* ]]; then
    # Extract username and repo name from URL
    if [[ $remote_url =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
        username="${BASH_REMATCH[1]}"
        repo="${BASH_REMATCH[2]}"
        
        echo ""
        echo "🎉 Deployment initiated!"
        echo "📋 Repository: $username/$repo"
        echo "🔗 Your app will be available at:"
        echo "   https://$username.github.io/$repo"
        echo ""
        echo "⏳ GitHub Pages deployment usually takes 1-5 minutes."
        echo "📖 Check deployment status at:"
        echo "   https://github.com/$username/$repo/actions"
        echo ""
        echo "🛠️  To enable GitHub Pages (if not done yet):"
        echo "   1. Go to: https://github.com/$username/$repo/settings/pages"
        echo "   2. Source: Deploy from a branch"
        echo "   3. Branch: main"
        echo "   4. Folder: / (root)"
        echo "   5. Click Save"
        echo ""
        echo "✨ Happy coding!"
    fi
fi